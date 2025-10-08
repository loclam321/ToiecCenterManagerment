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
        def _serialize(value):
            try:
                return value.isoformat()  # datetime-like
            except AttributeError:
                return value  # keep as-is (e.g., int, str, None)

        return {
            "test_id": self.test_id,
            "test_name": self.test_name,
            "test_description": self.test_description,
            "test_duration_min": self.test_duration_min,
            # Field type may vary in existing data; serialize defensively
            "test_total_questions": _serialize(self.test_total_questions),
            "test_status": _serialize(self.test_status),
        }
