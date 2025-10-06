from app.config import db
from sqlalchemy import func
from datetime import datetime
from .skill_model import Skill


class Test(db.Model):
    __tablename__ = "TEST"

    test_id = db.Column("TEST_ID", db.Integer, primary_key=True, nullable=False)
    test_name = db.Column("TEST_NAME", db.String(100))
    test_description = db.Column("TEST_DESCRIPTION", db.Text)
    test_duration_min = db.Column("TEST_DURATION_MIN", db.Integer)
    test_total_questions = db.Column("TEST_TOTAL_QUESTIONS", db.DateTime)
    test_status = db.Column("TEST_STATUS", db.DateTime)

    def __repr__(self):
        return f"<Test {self.test_id}: {self.test_name}>"

    def to_dict(self):
        return {
            "test_id": self.test_id,
            "test_name": self.test_name,
            "test_description": self.test_description,
            "test_duration_min": self.test_duration_min,
            "test_total_questions": (
                self.test_total_questions.isoformat()
                if self.test_total_questions
                else None
            ),
            "test_status": self.test_status.isoformat() if self.test_status else None,
        }
