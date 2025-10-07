from app.config import db
from sqlalchemy import func
from datetime import date
from .course_model import Course


class Class(db.Model):
    __tablename__ = "classes"  # Đổi tên để phù hợp với quy ước số nhiều

    class_id = db.Column(db.Integer, primary_key=True, nullable=False)
    course_id = db.Column(db.String(10), db.ForeignKey('course.course_id'), nullable=False)
    class_name = db.Column(db.String(100), nullable=True)
    class_startdate = db.Column(db.Date, nullable=True)
    class_enddate = db.Column(db.Date, nullable=True)
    class_maxstudents = db.Column(db.Integer, nullable=True)
    class_currentenrollment = db.Column(db.Integer, default=0)
    class_status = db.Column(db.String(30), default="ACTIVE")
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    # Relationship với Course
    course = db.relationship('Course', backref=db.backref('classes', lazy=True))

    def __repr__(self):
        return f"<Class {self.class_id}: {self.class_name}>"

    def to_dict(self):
        """Chuyển đổi class thành dict để trả về qua API"""
        return {
            'class_id': self.class_id,
            'course_id': self.course_id,
            'class_name': self.class_name,
            'class_startdate': self.class_startdate.strftime('%Y-%m-%d') if self.class_startdate else None,
            'class_enddate': self.class_enddate.strftime('%Y-%m-%d') if self.class_enddate else None,
            'class_maxstudents': self.class_maxstudents,
            'class_currentenrollment': self.class_currentenrollment,
            'class_status': self.class_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thêm thông tin course nếu cần
            'course_name': self.course.course_name if self.course else None
        }
    
    def is_active(self):
        """Kiểm tra class có đang active không"""
        return self.class_status == "ACTIVE"
    
    def is_full(self):
        """Kiểm tra lớp đã đủ số lượng sinh viên chưa"""
        if self.class_maxstudents is None:
            return False
        return self.class_currentenrollment >= self.class_maxstudents
    
    def is_ongoing(self):
        """Kiểm tra lớp đang trong thời gian học không"""
        today = date.today()
        if not self.class_startdate or not self.class_enddate:
            return False
        return self.class_startdate <= today <= self.class_enddate