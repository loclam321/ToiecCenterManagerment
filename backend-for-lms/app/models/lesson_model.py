from app.config import db
from datetime import date
from .learning_path_model import LearningPath
from .part_model import Part


class Lesson(db.Model):
    __tablename__ = "lesson"

    ls_id = db.Column(db.Integer, primary_key=True, nullable=False)
    lp_id = db.Column(
        db.Integer,
        db.ForeignKey(
            f"{LearningPath.__tablename__}.lp_id",
            ondelete="RESTRICT",
            onupdate="RESTRICT",
        ),
        nullable=True,
    )
    part_id = db.Column(
        db.Integer,
        db.ForeignKey(
            f"{Part.__tablename__}.part_id",
            ondelete="RESTRICT",
            onupdate="RESTRICT",
        ),
        nullable=True,
    )
    ls_name = db.Column(db.String(150), nullable=True)
    ls_link = db.Column(db.String(255), nullable=True)
    ls_date = db.Column(db.Date, nullable=True)

    learning_path = db.relationship(
        "LearningPath", backref=db.backref("lessons", lazy=True)
    )
    part = db.relationship("Part", backref=db.backref("lessons", lazy=True))

    def __repr__(self):
        return f"<Lesson {self.ls_id}: {self.ls_name}>"

    def to_dict(self):
        return {
            "ls_id": self.ls_id,
            "lp_id": self.lp_id,
            "part_id": self.part_id,
            "ls_name": self.ls_name,
            "ls_link": self.ls_link,
            "ls_date": self.ls_date.strftime("%Y-%m-%d") if self.ls_date else None,
            "learning_path_name": (
                self.learning_path.lp_name if self.learning_path else None
            ),
            "part_code": self.part.part_code if self.part else None,
        }

    @property
    def learning_path_name(self):
        return self.learning_path.lp_name if self.learning_path else None

    @property
    def part_code(self):
        return self.part.part_code if self.part else None

    def is_published(self):
        return self.ls_date is not None and self.ls_date <= date.today()

    def has_valid_link(self):
        return self.ls_link is not None and self.ls_link.strip() != ""
