from app.config import db
from sqlalchemy import func
from .test_model import Test
from .question_model import Question


class TestQuestion(db.Model):
    """Model cho bảng HAS_QUESTION - quan hệ nhiều-nhiều giữa Test và Question"""
    __tablename__ = "has_question"
    
    # Composite primary key
    test_id = db.Column(db.Integer, db.ForeignKey('tests.test_id'), primary_key=True)
    qs_index = db.Column(db.Integer, db.ForeignKey('questions.qs_index'), primary_key=True)
    
    # Thêm trường để xác định thứ tự câu hỏi trong bài kiểm tra
    question_order = db.Column(db.Integer, nullable=True)
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    test = db.relationship('Test', backref=db.backref('test_questions', lazy='dynamic', cascade='all, delete-orphan'))
    question = db.relationship('Question', backref=db.backref('test_questions', lazy='dynamic'))
    
    def __repr__(self):
        return f"<TestQuestion: Test {self.test_id}, Question {self.qs_index}>"
    
    def to_dict(self):
        """Chuyển đổi test_question thành dict để trả về qua API"""
        return {
            'test_id': self.test_id,
            'qs_index': self.qs_index,
            'question_order': self.question_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin bổ sung
            'test_name': self.test.test_name if self.test else None,
            'question_description': self.question.qs_desciption if self.question else None
        }