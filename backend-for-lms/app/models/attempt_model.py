from app.config import db
from .test_model import Test
from .enrollment_model import Enrollment
from .class_model import Class


class Attempt(db.Model):
    __tablename__ = "ATTEMPT"

    att_id = db.Column("ATT_ID", db.Integer, primary_key=True, autoincrement=True, nullable=False)
    test_id = db.Column(
        "TEST_ID",
        db.Integer,
        db.ForeignKey("TEST.TEST_ID", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
    )
    user_id = db.Column(
        "USER_ID",
        db.String(10),
        db.ForeignKey("ENROLLMENT.USER_ID", ondelete="RESTRICT", onupdate="RESTRICT"),
    )
    class_id = db.Column("CLASS_ID", db.Integer)
    att_started_at = db.Column("ATT_STARTED_AT", db.DateTime)
    att_submitted_at = db.Column("ATT_SUBMITTED_AT", db.DateTime)
    att_raw_score = db.Column("ATT_RAW_SCORE", db.Integer)
    att_scaled_listening = db.Column("ATT_SCALED_LISTENING", db.Integer)
    att_scaled_reading = db.Column("ATT_SCALED_READING", db.Integer)
    att_status = db.Column("ATT_STATUS", db.String(12))
    att_responses_json = db.Column("ATT_RESPONSES_JSON", db.String(10))

    test = db.relationship("Test", backref=db.backref("attempts", lazy=True))
    enrollment = db.relationship("Enrollment", backref=db.backref("attempts", lazy=True), primaryjoin="Attempt.user_id == Enrollment.user_id")
    class_ref = db.relationship("Class", backref=db.backref("attempts", lazy=True), primaryjoin="Attempt.class_id == Class.class_id", foreign_keys=[class_id], uselist=False)

    def __repr__(self):
        return f"<Attempt {self.att_id} - Test {self.test_id}>"

    def to_dict(self):
        return {
            "att_id": self.att_id,
            "test_id": self.test_id,
            "user_id": self.user_id,
            "class_id": self.class_id,
            "att_started_at": self.att_started_at.isoformat() if self.att_started_at else None,
            "att_submitted_at": self.att_submitted_at.isoformat() if self.att_submitted_at else None,
            "att_raw_score": self.att_raw_score,
            "att_scaled_listening": self.att_scaled_listening,
            "att_scaled_reading": self.att_scaled_reading,
            "att_status": self.att_status,
            "att_responses_json": self.att_responses_json,
        }