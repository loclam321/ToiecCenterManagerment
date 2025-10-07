from app.config import db
from .test_model import Test
from .enrollment_model import Enrollment
from .class_model import Class
from sqlalchemy import and_


class Attempt(db.Model):
    __tablename__ = "attempts"

    att_id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    test_id = db.Column(
        db.Integer,
        db.ForeignKey(
            f"{Test.__tablename__}.test_id", ondelete="RESTRICT", onupdate="RESTRICT"
        ),
        nullable=False,
    )
    user_id = db.Column(db.String(10), nullable=False)
    class_id = db.Column(db.Integer, nullable=False)
    att_started_at = db.Column(db.DateTime)
    att_submitted_at = db.Column(db.DateTime)
    att_raw_score = db.Column(db.Integer)
    att_scaled_listening = db.Column(db.Integer)
    att_scaled_reading = db.Column(db.Integer)
    att_status = db.Column(db.String(12))
    att_responses_json = db.Column(db.String(10))

    __table_args__ = (
        db.ForeignKeyConstraint(
            [user_id, class_id],
            [
                f"{Enrollment.__tablename__}.user_id",
                f"{Enrollment.__tablename__}.class_id",
            ],
            ondelete="RESTRICT",
            onupdate="RESTRICT",
        ),
    )

    test = db.relationship("Test", backref=db.backref("attempts", lazy=True))
    class_ref = db.relationship(
        "Class",
        backref=db.backref("attempts", lazy=True),
        primaryjoin="Attempt.class_id == Class.class_id",
        foreign_keys=[class_id],
        uselist=False,
    )
    enrollment = db.relationship(
        "Enrollment",
        backref=db.backref("attempts", lazy=True),
        primaryjoin=and_(
            user_id == Enrollment.user_id, class_id == Enrollment.class_id
        ),
        viewonly=True,
    )

    def __repr__(self):
        return f"<Attempt {self.att_id} - Test {self.test_id}>"

    def to_dict(self):
        return {
            "att_id": self.att_id,
            "test_id": self.test_id,
            "user_id": self.user_id,
            "class_id": self.class_id,
            "att_started_at": (
                self.att_started_at.isoformat() if self.att_started_at else None
            ),
            "att_submitted_at": (
                self.att_submitted_at.isoformat() if self.att_submitted_at else None
            ),
            "att_raw_score": self.att_raw_score,
            "att_scaled_listening": self.att_scaled_listening,
            "att_scaled_reading": self.att_scaled_reading,
            "att_status": self.att_status,
            "att_responses_json": self.att_responses_json,
        }
