from app.config import db


class Course(db.Model):
    __tablename__ = "course"

    course_id = db.Column(db.String(10), primary_key=True, nullable=False)
    cou_course_id = db.Column(
        db.String(10),
        db.ForeignKey("course.course_id", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=True,
    )
    course_name = db.Column(db.String(100), nullable=True)
    course_description = db.Column(db.String(1024), nullable=True)
    course_code = db.Column(db.String(15), nullable=True)
    course_status = db.Column(db.String(50), nullable=True)

    parent_course = db.relationship(
        "Course",
        remote_side=[course_id],
        backref=db.backref("child_courses", lazy="joined"),
        foreign_keys=[cou_course_id],
    )

    def __repr__(self) -> str:
        return f"<Course id={self.course_id} code={self.course_code}>"

    def to_dict(self) -> dict:
        return {
            "course_id": self.course_id,
            "cou_course_id": self.cou_course_id,
            "course_name": self.course_name,
            "course_description": self.course_description,
            "course_code": self.course_code,
            "course_status": self.course_status,
        }
