from app.config import db
from sqlalchemy import Enum, func


class Test(db.Model):
    __tablename__ = "tests"

    test_id = db.Column(db.Integer, primary_key=True, nullable=False)
    test_name = db.Column(db.String(100), nullable=True)
    test_description = db.Column(db.Text, nullable=True)
    test_duration_min = db.Column(db.Integer, nullable=True)

    # ✅ SỬA: Từ DateTime thành Integer (số lượng câu hỏi)
    test_total_questions = db.Column(db.Integer, nullable=True)

    # ✅ SỬA: Từ DateTime thành String (trạng thái: ACTIVE, INACTIVE, DRAFT, etc.)
    test_status = db.Column(db.String(20), nullable=True, default="DRAFT")

    # Liên kết tới lớp và giáo viên phụ trách
    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.class_id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )
    teacher_id = db.Column(
        db.String(10),
        db.ForeignKey("teachers.user_id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    # Thiết lập thời gian mở/đóng, giới hạn lượt và thời lượng làm bài
    available_from = db.Column(db.DateTime(timezone=True))
    due_at = db.Column(db.DateTime(timezone=True))
    max_attempts = db.Column(db.Integer, nullable=True, default=2)
    time_limit_min = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(
        db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    class_obj = db.relationship(
        "Class", backref=db.backref("tests", lazy="dynamic")
    )
    teacher = db.relationship(
        "Teacher", backref=db.backref("tests", lazy="dynamic")
    )

    # Hoặc dùng Enum cho test_status nếu muốn chặt chẽ hơn:
    # test_status = db.Column(
    #     Enum('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', name='test_status_enum'),
    #     nullable=True,
    #     default='DRAFT'
    # )

    def __repr__(self):
        return f"<Test {self.test_id}: {self.test_name}>"

    def to_dict(self):
        """Chuyển đổi Test object thành dictionary"""
        return {
            "test_id": self.test_id,
            "test_name": self.test_name,
            "test_description": self.test_description,
            "test_duration_min": self.test_duration_min,
            "test_total_questions": self.test_total_questions,  # Integer
            "test_status": self.test_status,  # String
            "class_id": self.class_id,
            "teacher_id": self.teacher_id,
            "available_from": self.available_from.isoformat() if self.available_from else None,
            "due_at": self.due_at.isoformat() if self.due_at else None,
            "max_attempts": self.max_attempts,
            "time_limit_min": self.time_limit_min,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
