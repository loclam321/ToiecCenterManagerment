from app.config import db
from sqlalchemy import func, CheckConstraint, Enum, Date, Text
from sqlalchemy.dialects.mysql import SMALLINT, DECIMAL, TINYINT


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
    mode = db.Column(
        Enum("ONLINE", "OFFLINE", "HYBRID", name="course_mode_enum"),
        nullable=True,
        default="OFFLINE",
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
        Enum("DRAFT", "OPEN", "RUNNING", "CLOSED", "ARCHIVED", name="course_status_enum"),
        nullable=False,
        server_default="OPEN",
    )
    is_deleted = db.Column(TINYINT(unsigned=True), nullable=False, server_default="0")

    # Links (nullable for incremental rollout)
    teacher_id = db.Column(db.String(10), nullable=True)
    learning_path_id = db.Column(db.String(10), nullable=True)
    campus_id = db.Column(db.String(10), nullable=True)

    # Audit
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("tuition_fee >= 0", name="chk_course_tuition_nonneg"),
        CheckConstraint("capacity IS NULL OR capacity >= 0", name="chk_course_capacity_nonneg"),
        CheckConstraint(
            "(start_date IS NULL AND end_date IS NULL) OR (start_date <= end_date)",
            name="chk_course_dates_valid",
        ),
    )

    # Property để tương thích với code cũ sử dụng course_status
    @property
    def course_status(self):
        """Alias cho trường status để tương thích với code cũ"""
        return self.status
    
    @course_status.setter
    def course_status(self, value):
        """Setter cho course_status để có thể set giá trị"""
        self.status = value

    def __repr__(self):
        return f"<Course(course_id='{self.course_id}', code='{self.course_code}', name='{self.course_name}')>"

    def to_dict(self):
        return {
            "course_id": self.course_id,
            "course_code": self.course_code,
            "course_name": self.course_name,
            "course_description": self.course_description,
            "target_score": int(self.target_score) if self.target_score is not None else None,
            "level": self.level,
            "mode": self.mode,
            "schedule_text": self.schedule_text,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "session_count": int(self.session_count) if self.session_count is not None else None,
            "total_hours": int(self.total_hours) if self.total_hours is not None else None,
            "tuition_fee": float(self.tuition_fee) if self.tuition_fee is not None else None,
            "capacity": int(self.capacity) if self.capacity is not None else None,
            # Back-compat key
            "status": self.status,
            "course_status": self.status,
            "is_deleted": bool(int(self.is_deleted)) if self.is_deleted is not None else False,
            "teacher_id": self.teacher_id,
            "learning_path_id": self.learning_path_id,
            "campus_id": self.campus_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
