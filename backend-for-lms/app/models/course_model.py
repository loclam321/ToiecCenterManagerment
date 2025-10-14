from app.config import db
from sqlalchemy import func, CheckConstraint, Enum, Date, Text, ForeignKey
from sqlalchemy.dialects.mysql import SMALLINT, DECIMAL, TINYINT
from sqlalchemy.orm import relationship


class Course(db.Model):
    __tablename__ = "courses"

    # Keys & identifiers
    course_id = db.Column(db.String(10), primary_key=True, nullable=False)
    course_code = db.Column(db.String(32), unique=True, nullable=True)

    # Display info
    course_name = db.Column(db.String(100), nullable=False)
    course_description = db.Column(Text, nullable=True)

    # Academic & classification
    target_score = db.Column(SMALLINT(unsigned=True), nullable=True)
    level = db.Column(
        Enum("BEGINNER", "INTERMEDIATE", "ADVANCED", name="course_level_enum"),
        nullable=True,
    )

    # Schedule & duration
    schedule_text = db.Column(db.String(120), nullable=True)
    start_date = db.Column(Date, nullable=True)
    end_date = db.Column(Date, nullable=True)
    session_count = db.Column(SMALLINT(unsigned=True), nullable=True)
    total_hours = db.Column(SMALLINT(unsigned=True), nullable=True)

    # Fee & capacity
    tuition_fee = db.Column(DECIMAL(12, 2), nullable=True)
    capacity = db.Column(SMALLINT(unsigned=True), nullable=True)

    # Lifecycle & soft-delete
    status = db.Column(
        Enum(
            "DRAFT", "OPEN", "RUNNING", "CLOSED", "ARCHIVED", name="course_status_enum"
        ),
        nullable=False,
        server_default="OPEN",
    )

    # Links (nullable for incremental rollout)

    # Prerequisite course - Self-referencing foreign key
    cou_course_id = db.Column(
        db.String(10),
        ForeignKey("courses.course_id", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=True,
        comment="ID của khóa học tiên quyết (prerequisite course)",
    )

    # Audit
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    # Relationships
    # Khóa học tiên quyết (prerequisite) - self-referencing
    prerequisite_course = relationship(
        "Course",
        remote_side=[course_id],
        backref="dependent_courses",
        foreign_keys=[cou_course_id],
    )

    __table_args__ = (
        CheckConstraint("tuition_fee >= 0", name="chk_course_tuition_nonneg"),
        CheckConstraint(
            "capacity IS NULL OR capacity >= 0", name="chk_course_capacity_nonneg"
        ),
        CheckConstraint(
            "(start_date IS NULL AND end_date IS NULL) OR (start_date <= end_date)",
            name="chk_course_dates_valid",
        ),
        CheckConstraint(
            "cou_course_id != course_id", name="chk_course_not_self_prerequisite"
        ),
    )

    # Property để tương thích với code cũ sử dụng course_status
    @property
    def course_status(self):
        """Alias cho trường status để tương thích với code cũ"""
        return self.status

    def get_cou_course_id(self):
        """Lấy cou_course_id (khóa học tiên quyết)"""
        return self.cou_course_id

    @course_status.setter
    def course_status(self, value):
        """Setter cho course_status để có thể set giá trị"""
        self.status = value

    def __repr__(self):
        return f"<Course(course_id='{self.course_id}', code='{self.course_code}', name='{self.course_name}')>"

    def to_dict(self, include_prerequisite=False):
        """
        Chuyển đổi object Course thành dictionary

        Args:
            include_prerequisite: Có include thông tin khóa học tiên quyết không
        """
        result = {
            # Keys & identifiers
            "course_id": self.course_id,
            "course_code": self.course_code,
            # Display info
            "course_name": self.course_name,
            "course_description": self.course_description,
            # Academic & classification
            "target_score": (
                int(self.target_score) if self.target_score is not None else None
            ),
            "level": self.level,
            # Schedule & duration
            "schedule_text": self.schedule_text,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "session_count": (
                int(self.session_count) if self.session_count is not None else None
            ),
            "total_hours": (
                int(self.total_hours) if self.total_hours is not None else None
            ),
            # Fee & capacity
            "tuition_fee": (
                float(self.tuition_fee) if self.tuition_fee is not None else None
            ),
            "capacity": int(self.capacity) if self.capacity is not None else None,
            # Lifecycle & status
            "status": self.status,
            "course_status": self.status,  # Alias để tương thích với code cũ
            
            "cou_course_id": self.cou_course_id,  # Prerequisite course ID
            "campus_id": getattr(self, "campus_id", None),
            # Audit
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        # Include prerequisite course info nếu được yêu cầu
        if include_prerequisite and self.prerequisite_course:
            result["prerequisite_course"] = {
                "course_id": self.prerequisite_course.course_id,
                "course_code": self.prerequisite_course.course_code,
                "course_name": self.prerequisite_course.course_name,
                "level": self.prerequisite_course.level,
                "status": self.prerequisite_course.status,
            }

        return result
