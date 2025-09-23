from app.config import db
from sqlalchemy import func
from .question_model import Question


class Answer(db.Model):
    """Model cho bảng ANSWER - các phương án trả lời của câu hỏi"""
    __tablename__ = "answers"
    
    as_index = db.Column(db.Integer, primary_key=True, nullable=False)
    qs_index = db.Column(db.Integer, db.ForeignKey('questions.qs_index'), nullable=False)
    as_true = db.Column(db.Boolean, nullable=True, default=False)
    
    # Thêm trường nội dung cho câu trả lời (không có trong schema gốc)
    as_content = db.Column(db.Text, nullable=True)
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationship với Question
    question = db.relationship('Question', backref=db.backref('answers', lazy=True, cascade='all, delete-orphan'))
    
    def __repr__(self):
        return f"<Answer {self.as_index} for Question {self.qs_index}: {self.as_true}>"
    
    def to_dict(self):
        """Chuyển đổi answer thành dict để trả về qua API"""
        return {
            'as_index': self.as_index,
            'qs_index': self.qs_index,
            'as_true': self.as_true,
            'as_content': self.as_content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_correct_answer(cls, qs_index):
        """Lấy câu trả lời đúng của câu hỏi"""
        return cls.query.filter_by(qs_index=qs_index, as_true=True).first()
    
    @classmethod
    def get_answers_for_question(cls, qs_index):
        """Lấy tất cả câu trả lời của câu hỏi"""
        return cls.query.filter_by(qs_index=qs_index).all()