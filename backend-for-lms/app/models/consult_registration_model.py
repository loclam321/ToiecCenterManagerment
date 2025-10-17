from app.config import db
from sqlalchemy import func, ForeignKey, Date, Text
from datetime import datetime


class ConsultRegistration(db.Model):
    """
    Model cho đăng ký tư vấn khóa học
    
    Attributes:
        cr_id: ID đăng ký tư vấn (Primary Key, Auto Increment)
        course_id: ID khóa học (Foreign Key -> Course)
        cr_fullname: Họ tên người đăng ký
        cr_birthday: Ngày sinh
        cr_phone: Số điện thoại
        cr_email: Email liên hệ
        cr_gender: Giới tính (M/F)
        created_at: Thời gian tạo
        updated_at: Thời gian cập nhật
    """

    __tablename__ = "consult_registration"

    # Primary Key
    cr_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Foreign Key
    course_id = db.Column(
        db.String(10),
        ForeignKey("courses.course_id", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
        index=True,
        comment="ID của khóa học được tư vấn",
    )

    # Basic Information
    cr_fullname = db.Column(
        db.String(100),
        nullable=True,
        comment="Họ tên người đăng ký tư vấn",
    )

    cr_birthday = db.Column(
        Date,
        nullable=True,
        comment="Ngày sinh",
    )

    cr_phone = db.Column(
        db.String(15),
        nullable=True,
        comment="Số điện thoại liên hệ",
    )

    cr_email = db.Column(
        db.String(100),
        nullable=True,
        comment="Email liên hệ",
    )

    cr_gender = db.Column(
        db.String(1),
        nullable=True,
        comment="Giới tính (M: Male, F: Female)",
    )

    # Timestamps
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=func.now(),
        comment="Thời gian tạo",
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=True,
        onupdate=func.now(),
        comment="Thời gian cập nhật",
    )

    # Relationships
    course = db.relationship(
        "Course",
        backref=db.backref("consult_registrations", lazy="dynamic"),
        foreign_keys=[course_id],
    )

    def __repr__(self):
        return f"<ConsultRegistration(cr_id={self.cr_id}, fullname='{self.cr_fullname}', course_id='{self.course_id}')>"

    def to_dict(self, include_course=False):
        """
        Convert model instance to dictionary
        
        Args:
            include_course: Có bao gồm thông tin khóa học không
            
        Returns:
            Dictionary chứa thông tin đăng ký tư vấn
        """
        data = {
            "cr_id": self.cr_id,
            "course_id": self.course_id,
            "cr_fullname": self.cr_fullname,
            "cr_birthday": self.cr_birthday.isoformat() if self.cr_birthday else None,
            "cr_phone": self.cr_phone,
            "cr_email": self.cr_email,
            "cr_gender": self.cr_gender,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_course and self.course:
            data["course"] = {
                "course_id": self.course.course_id,
                "course_code": self.course.course_code,
                "course_name": self.course.course_name,
                "status": self.course.status,
                "level": self.course.level,
            }

        return data

    @staticmethod
    def validate_gender(gender):
        """Validate giới tính"""
        if gender and gender not in ["M", "F"]:
            raise ValueError("Gender must be 'M' or 'F'")
        return gender

    @staticmethod
    def validate_email(email):
        """Validate email format (basic)"""
        import re
        if email and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Invalid email format")
        return email

    @staticmethod
    def validate_phone(phone):
        """Validate phone number (basic)"""
        import re
        if phone and not re.match(r"^\d{10,15}$", phone):
            raise ValueError("Phone must be 10-15 digits")
        return phone