from app.config import db
from sqlalchemy import func
from datetime import date
from .course_model import Course


class Class(db.Model):
    __tablename__ = "classes"  # Đổi tên để phù hợp với quy ước số nhiều

    class_id = db.Column(db.Integer, primary_key=True, nullable=False)
    course_id = db.Column(
        db.String(10), db.ForeignKey("courses.course_id"), nullable=False
    )
    class_name = db.Column(db.String(100), nullable=True)
    class_startdate = db.Column(db.Date, nullable=True)
    class_enddate = db.Column(db.Date, nullable=True)
    class_maxstudents = db.Column(db.Integer, nullable=True)
    class_currentenrollment = db.Column(db.Integer, default=0)
    class_status = db.Column(db.String(30), default="ACTIVE")
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    # Relationship với Course
    course = db.relationship("Course", backref=db.backref("classes", lazy=True))

    def __repr__(self):
        return f"<Class {self.class_id}: {self.class_name}>"

    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        result = {
            "class_id": self.class_id,
            "course_id": self.course_id,
            "class_name": self.class_name,
            "class_startdate": (
                self.class_startdate.isoformat() if self.class_startdate else None
            ),
            "class_enddate": (
                self.class_enddate.isoformat() if self.class_enddate else None
            ),
            "class_maxstudents": (
                int(self.class_maxstudents)
                if self.class_maxstudents is not None
                else None
            ),
            "class_currentenrollment": (
                int(self.class_currentenrollment)
                if self.class_currentenrollment is not None
                else 0
            ),
            "class_status": self.class_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        # Thêm thông tin course nếu có relationship
        if self.course:
            result["course"] = {
                "course_id": self.course.course_id,
                "course_code": self.course.course_code,
                "course_name": self.course.course_name,
                "level": self.course.level,
                "status": self.course.status,
            }

        return result

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
