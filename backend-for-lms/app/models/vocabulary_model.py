from app.config import db
from sqlalchemy import func
from .lesson_model import Lesson


class Vocabulary(db.Model):
    """Model cho bảng VOCALBULARY - từ vựng liên quan đến bài học"""
    __tablename__ = "vocalbulary"  # Giữ nguyên tên bảng như trong schema
    
    vc_index = db.Column(db.Integer, primary_key=True, nullable=False)
    ls_id = db.Column(db.Integer, db.ForeignKey('lesson.ls_id'), nullable=False)
    vc_english = db.Column(db.String(100), nullable=True)
    vc_vietnamese = db.Column(db.String(100), nullable=True)
    vc_englishmean = db.Column(db.String(255), nullable=True)
    vc_vietnamesemean = db.Column(db.String(255), nullable=True)
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationship với Lesson
    # Use `noload` and passive_deletes to avoid SQLAlchemy automatically
    # issuing SELECTs against this table when a Lesson is deleted. The
    # production DB in some environments may not have this (misspelled)
    # table, so we avoid eager access by default. Accessing
    # `lesson.vocabularies` will still work if the table exists.
    lesson = db.relationship(
        'Lesson',
        backref=db.backref('vocabularies', lazy='noload', passive_deletes=True),
    )
    
    def __repr__(self):
        return f"<Vocabulary {self.vc_index}: {self.vc_english} - {self.vc_vietnamese}>"
    
    def to_dict(self):
        """Chuyển đổi vocabulary thành dict để trả về qua API"""
        return {
            'vc_index': self.vc_index,
            'ls_id': self.ls_id,
            'vc_english': self.vc_english,
            'vc_vietnamese': self.vc_vietnamese,
            'vc_englishmean': self.vc_englishmean,
            'vc_vietnamesemean': self.vc_vietnamesemean,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin liên quan
            'lesson_name': self.lesson.ls_name if self.lesson else None
        }
    
    @classmethod
    def get_by_lesson(cls, ls_id):
        """Lấy tất cả từ vựng của một bài học"""
        try:
            return cls.query.filter_by(ls_id=ls_id).all()
        except Exception:
            # Be defensive: if the underlying table does not exist or
            # another DB error occurs, return an empty list instead of
            # raising — this makes lesson deletion and other flows more
            # resilient in environments where the vocabulary table is
            # missing or being migrated.
            return []
    
    @classmethod
    def search(cls, keyword):
        """Tìm kiếm từ vựng theo từ khóa"""
        return cls.query.filter(
            (cls.vc_english.ilike(f"%{keyword}%")) |
            (cls.vc_vietnamese.ilike(f"%{keyword}%")) |
            (cls.vc_englishmean.ilike(f"%{keyword}%")) |
            (cls.vc_vietnamesemean.ilike(f"%{keyword}%"))
        ).all()
    
    def has_full_definitions(self):
        """Kiểm tra từ vựng có đầy đủ định nghĩa không"""
        return (
            self.vc_english and
            self.vc_vietnamese and
            self.vc_englishmean and
            self.vc_vietnamesemean
        )
    
    @property
    def lesson_name(self):
        """Getter để lấy tên bài học"""
        return self.lesson.ls_name if self.lesson else None