from app.config import db
from sqlalchemy import func
from datetime import date
from .skill_model import Skill


class Lesson(db.Model):
    __tablename__ = "lessons"  # Số nhiều theo quy ước

    ls_id = db.Column(db.Integer, primary_key=True, nullable=False)
    sk_id = db.Column(db.Integer, db.ForeignKey('skills.sk_id'), nullable=False)
    ls_name = db.Column(db.String(150), nullable=True)
    ls_link = db.Column(db.String(255), nullable=True)
    ls_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    # Relationship với Skill
    skill = db.relationship('Skill', backref=db.backref('lessons', lazy=True))

    def __repr__(self):
        return f"<Lesson {self.ls_id}: {self.ls_name}>"

    def to_dict(self):
        """Chuyển đổi lesson thành dict để trả về qua API"""
        return {
            'ls_id': self.ls_id,
            'sk_id': self.sk_id,
            'ls_name': self.ls_name,
            'ls_link': self.ls_link,
            'ls_date': self.ls_date.strftime('%Y-%m-%d') if self.ls_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin liên quan đến skill
            'skill_name': self.skill.sk_name if self.skill else None
        }

    @property
    def skill_name(self):
        """Getter để lấy tên skill"""
        return self.skill.sk_name if self.skill else None
    
    @property
    def learning_path_id(self):
        """Getter để lấy learning path ID"""
        return self.skill.lp_id if self.skill else None
    
    def is_published(self):
        """Kiểm tra bài học đã được publish chưa"""
        return self.ls_date is not None and self.ls_date <= date.today()
    
    def has_valid_link(self):
        """Kiểm tra bài học có link hợp lệ không"""
        return self.ls_link is not None and self.ls_link.strip() != ""