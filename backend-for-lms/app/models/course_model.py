from app.config import db
from sqlalchemy import func


class Course(db.Model):
    __tablename__ = "courses"

    course_id = db.Column(db.String(10), primary_key=True, nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    course_description = db.Column(db.Text, nullable=True)
    course_status = db.Column(db.String(15), nullable=False, default="ACTIVE")
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return (
            f"<Course(course_id='{self.course_id}', course_name='{self.course_name}')>"
        )

    def to_dict(self):
        return {
            "course_id": self.course_id,
            "course_name": self.course_name,
            "course_description": self.course_description,
            "course_status": self.course_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
