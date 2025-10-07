from app.config import db


class Test(db.Model):
    __tablename__ = "tests"

    test_id = db.Column(db.Integer, primary_key=True, nullable=False)
    test_name = db.Column(db.String(100))
    test_description = db.Column(db.Text)
    test_duration_min = db.Column(db.Integer)
    test_total_questions = db.Column(db.DateTime)
    test_status = db.Column(db.DateTime)

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
