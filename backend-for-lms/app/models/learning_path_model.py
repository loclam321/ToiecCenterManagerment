from app.config import db
from sqlalchemy import func
from .course_model import Course
import json


class LearningPath(db.Model):
    __tablename__ = "learning_paths"

    # Sử dụng course_id làm primary key (1-1)
    course_id = db.Column(
        db.String(10),
        db.ForeignKey("course.course_id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
        nullable=False,  # Thêm dòng này để đảm bảo rõ ràng
    )

    # Giữ lại trường cũ nhưng không phải là primary key
    lp_id = db.Column(db.Integer, autoincrement=True, unique=True, index=True, nullable=False)

    # Giữ lại các trường dữ liệu cũ
    __tablename__ = "learning_paths"

    # Sử dụng course_id làm primary key (1-1)
    course_id = db.Column(
        db.String(10),
        db.ForeignKey("course.course_id", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True,
        nullable=False,  # Thêm dòng này để đảm bảo rõ ràng
    )

    # Giữ lại trường cũ nhưng không phải là primary key
    lp_id = db.Column(db.Integer, autoincrement=True, unique=True, index=True, nullable=False)

    # Giữ lại các trường dữ liệu cũ
    lp_name = db.Column(db.String(100), nullable=True)
    lp_desciption = db.Column(db.Text, nullable=True)  # Giữ nguyên tên trường như SQL

    # Thêm các trường mới: Marketing / academic content
    lp_summary = db.Column(db.Text, nullable=True)
    program_outline_json = db.Column(db.Text, nullable=True)
    highlights_json = db.Column(db.Text, nullable=True)
    intro_video_url = db.Column(db.String(255), nullable=True)
    thumbnail_url = db.Column(db.String(255), nullable=True)
    banner_url = db.Column(db.String(255), nullable=True)
    published_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Audit fields
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    # Thêm các trường mới: Marketing / academic content
    lp_summary = db.Column(db.Text, nullable=True)
    program_outline_json = db.Column(db.Text, nullable=True)
    highlights_json = db.Column(db.Text, nullable=True)
    intro_video_url = db.Column(db.String(255), nullable=True)
    thumbnail_url = db.Column(db.String(255), nullable=True)
    banner_url = db.Column(db.String(255), nullable=True)
    published_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Audit fields
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    # Cập nhật mối quan hệ: One-to-one với Course
    course = db.relationship(
        "Course", backref=db.backref("learning_path", uselist=False)
    )
    # Cập nhật mối quan hệ: One-to-one với Course
    course = db.relationship(
        "Course", backref=db.backref("learning_path", uselist=False)
    )

    def __repr__(self):
        return f"<LearningPath {self.lp_id} for Course {self.course_id}>"
        return f"<LearningPath {self.lp_id} for Course {self.course_id}>"

    def to_dict(self):
        """Chuyển đổi learning path thành dict để trả về qua API, bao gồm cả trường cũ và mới"""
        """Chuyển đổi learning path thành dict để trả về qua API, bao gồm cả trường cũ và mới"""
        try:
            parsed_highlights = (
                json.loads(self.highlights_json) if self.highlights_json else []
            )
            # Đảm bảo định dạng: [{"title": str, "content": str}]
            if not isinstance(parsed_highlights, list):
                parsed_highlights = []
        except Exception:
            parsed_highlights = []
        return {
            # Các trường cũ
            "lp_id": self.lp_id,
            "course_id": self.course_id,
            "lp_name": self.lp_name,
            "lp_desciption": self.lp_desciption,
            # Các trường mới
            "course_name": self.course.course_name if self.course else None,
            "lp_summary": self.lp_summary,
            "program_outline_json": self.program_outline_json,
            "highlights_json": self.highlights_json,
            "intro_video_url": self.intro_video_url,
            "thumbnail_url": self.thumbnail_url,
            "banner_url": self.banner_url,
            "published_at": (
                self.published_at.isoformat() if self.published_at else None
            ),
            # Timestamp
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # Các trường cũ
            "lp_id": self.lp_id,
            "course_id": self.course_id,
            "lp_name": self.lp_name,
            "lp_desciption": self.lp_desciption,
            # Các trường mới
            "course_name": self.course.course_name if self.course else None,
            "lp_summary": self.lp_summary,
            "program_outline_json": self.program_outline_json,
            "highlights_json": parsed_highlights,
            "intro_video_url": self.intro_video_url,
            "thumbnail_url": self.thumbnail_url,
            "banner_url": self.banner_url,
            "published_at": (
                self.published_at.isoformat() if self.published_at else None
            ),
            # Timestamp
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

