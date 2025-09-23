from app.config import db
from sqlalchemy import func
from datetime import datetime
from .student_model import Student
from .class_model import Class


class Enrollment(db.Model):
    """Model cho bảng ENROLLMENT - quan hệ nhiều-nhiều giữa Student và Class"""
    __tablename__ = "enrollments"
    
    # Composite primary key
    user_id = db.Column(db.String(10), db.ForeignKey('students.user_id'), primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.class_id'), primary_key=True)
    
    # Thêm các trường để tracking
    enrolled_date = db.Column(db.DateTime(timezone=True), server_default=func.now())
    last_activity_date = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    status = db.Column(db.String(20), default="ACTIVE")  # ACTIVE, COMPLETED, DROPPED
    
    # Relationships
    student = db.relationship('Student', backref=db.backref('enrollments', lazy='dynamic'))
    class_obj = db.relationship('Class', backref=db.backref('enrollments', lazy='dynamic'))
    
    def __repr__(self):
        return f"<Enrollment: Student {self.user_id} in Class {self.class_id}>"
    
    def to_dict(self):
        """Chuyển đổi enrollment thành dict để trả về qua API"""
        return {
            'user_id': self.user_id,
            'class_id': self.class_id,
            'enrolled_date': self.enrolled_date.isoformat() if self.enrolled_date else None,
            'last_activity_date': self.last_activity_date.isoformat() if self.last_activity_date else None,
            'status': self.status,
            # Thông tin bổ sung
            'student_name': self.student.user_name if self.student else None,
            'class_name': self.class_obj.class_name if self.class_obj else None,
            'course_id': self.class_obj.course_id if self.class_obj else None
        }
    
    @classmethod
    def get_student_enrollments(cls, user_id):
        """Lấy tất cả các lớp học mà sinh viên đã đăng ký"""
        return cls.query.filter_by(user_id=user_id).all()
    
    @classmethod
    def get_class_enrollments(cls, class_id):
        """Lấy tất cả sinh viên đã đăng ký vào lớp học"""
        return cls.query.filter_by(class_id=class_id).all()
    
    @classmethod
    def is_enrolled(cls, user_id, class_id):
        """Kiểm tra xem sinh viên đã đăng ký lớp học chưa"""
        return cls.query.filter_by(user_id=user_id, class_id=class_id).first() is not None
    
    def mark_completed(self):
        """Đánh dấu hoàn thành khóa học"""
        self.status = "COMPLETED"
        self.last_activity_date = datetime.now()
        db.session.commit()
    
    def drop_enrollment(self):
        """Đánh dấu đã rút khỏi khóa học"""
        self.status = "DROPPED"
        self.last_activity_date = datetime.now()
        db.session.commit()