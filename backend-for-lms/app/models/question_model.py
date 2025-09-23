from app.config import db
from sqlalchemy import func


class Question(db.Model):
    """Model cho bảng QUESTION"""
    __tablename__ = "questions"
    
    qs_index = db.Column(db.Integer, primary_key=True, nullable=False)
    qs_desciption = db.Column(db.Text, nullable=True)  # Giữ nguyên tên trường như trong SQL (có typo)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Question {self.qs_index}>"
    
    def to_dict(self):
        """Chuyển đổi question thành dict để trả về qua API"""
        return {
            'qs_index': self.qs_index,
            'qs_desciption': self.qs_desciption,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }