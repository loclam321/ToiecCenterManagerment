from app.config import db
from sqlalchemy import func
from datetime import datetime
from .enrollment_model import Enrollment
from .test_model import Test


class Score(db.Model):
    """Model cho bảng SCORE - lưu điểm bài kiểm tra của học viên"""
    __tablename__ = "scores"
    
    # Composite primary key từ 3 trường
    user_id = db.Column(db.String(10), primary_key=True)
    class_id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.test_id'), primary_key=True)
    
    # Foreign key đến bảng Enrollment (đã có user_id và class_id làm composite key)
    __table_args__ = (
        db.ForeignKeyConstraint(['user_id', 'class_id'], ['enrollments.user_id', 'enrollments.class_id']),
    )
    
    # Điểm số
    sc_score = db.Column(db.Integer, nullable=True)
    
    # Thêm các trường tracking
    submitted_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    test = db.relationship('Test')
    enrollment = db.relationship('Enrollment')
    
    def __repr__(self):
        return f"<Score: Student {self.user_id}, Class {self.class_id}, Test {self.test_id}: {self.sc_score}>"
    
    def to_dict(self):
        """Chuyển đổi score thành dict để trả về qua API"""
        return {
            'user_id': self.user_id,
            'class_id': self.class_id,
            'test_id': self.test_id,
            'sc_score': self.sc_score,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin bổ sung nếu cần
            'test_name': self.test.test_name if self.test else None,
            'test_passing_score': float(self.test.test_passing_score) if self.test and self.test.test_passing_score else None,
            'test_total_score': float(self.test.test_total_score) if self.test and self.test.test_total_score else None,
            'student_name': self.enrollment.student.user_name if self.enrollment and self.enrollment.student else None,
        }
    
    def is_passed(self):
        """Kiểm tra học viên đã vượt qua bài kiểm tra chưa"""
        if not self.test or not self.sc_score or self.test.test_passing_score is None:
            return False
        return self.sc_score >= float(self.test.test_passing_score)
    
    def get_percentage_score(self):
        """Tính điểm theo phần trăm"""
        if not self.test or not self.sc_score or not self.test.test_total_score or float(self.test.test_total_score) == 0:
            return 0
        return (self.sc_score / float(self.test.test_total_score)) * 100
    
    @classmethod
    def get_student_scores(cls, user_id):
        """Lấy tất cả điểm của một học viên"""
        return cls.query.filter_by(user_id=user_id).all()
    
    @classmethod
    def get_class_scores(cls, class_id):
        """Lấy tất cả điểm của học viên trong một lớp"""
        return cls.query.filter_by(class_id=class_id).all()
    
    @classmethod
    def get_test_scores(cls, test_id):
        """Lấy tất cả điểm của một bài kiểm tra"""
        return cls.query.filter_by(test_id=test_id).all()
    
    @classmethod
    def get_average_score_for_test(cls, test_id):
        """Tính điểm trung bình của một bài kiểm tra"""
        from sqlalchemy import func
        result = db.session.query(func.avg(cls.sc_score).label('average')).filter_by(test_id=test_id).first()
        return result.average if result.average is not None else 0