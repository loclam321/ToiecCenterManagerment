from app.config import db
from sqlalchemy import func


class Word(db.Model):
    """Model cho bảng WORDS - từ vựng song ngữ Anh-Việt"""
    __tablename__ = "words"
    
    w_index = db.Column(db.Integer, primary_key=True, nullable=False)
    w_english = db.Column(db.String(100), nullable=True)
    w_vietnamese = db.Column(db.String(100), nullable=True)
    w_englishmean = db.Column(db.String(255), nullable=True)
    w_vietnamesemean = db.Column(db.String(255), nullable=True)
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Word {self.w_index}: {self.w_english} - {self.w_vietnamese}>"
    
    def to_dict(self):
        """Chuyển đổi word thành dict để trả về qua API"""
        return {
            'w_index': self.w_index,
            'w_english': self.w_english,
            'w_vietnamese': self.w_vietnamese,
            'w_englishmean': self.w_englishmean,
            'w_vietnamesemean': self.w_vietnamesemean,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def search_english(cls, keyword):
        """Tìm kiếm từ tiếng Anh"""
        return cls.query.filter(cls.w_english.ilike(f"%{keyword}%")).all()
    
    @classmethod
    def search_vietnamese(cls, keyword):
        """Tìm kiếm từ tiếng Việt"""
        return cls.query.filter(cls.w_vietnamese.ilike(f"%{keyword}%")).all()
    
    @classmethod
    def search(cls, keyword):
        """Tìm kiếm cả tiếng Anh và tiếng Việt"""
        return cls.query.filter(
            (cls.w_english.ilike(f"%{keyword}%")) | 
            (cls.w_vietnamese.ilike(f"%{keyword}%")) |
            (cls.w_englishmean.ilike(f"%{keyword}%")) |
            (cls.w_vietnamesemean.ilike(f"%{keyword}%"))
        ).all()
    
    def has_english_meaning(self):
        """Kiểm tra từ có định nghĩa tiếng Anh không"""
        return self.w_englishmean is not None and self.w_englishmean.strip() != ""
    
    def has_vietnamese_meaning(self):
        """Kiểm tra từ có định nghĩa tiếng Việt không"""
        return self.w_vietnamesemean is not None and self.w_vietnamesemean.strip() != ""
    
    def is_complete(self):
        """Kiểm tra từ có đầy đủ thông tin không"""
        return (
            self.w_english and self.w_vietnamese and 
            self.has_english_meaning() and self.has_vietnamese_meaning()
        )