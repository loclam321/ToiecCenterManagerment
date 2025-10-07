from app.config import db


class Part(db.Model):
    __tablename__ = "part"

    part_id = db.Column(db.Integer, primary_key=True, nullable=False)
    part_code = db.Column(db.String(10), nullable=False)
    part_name = db.Column(db.String(10), nullable=False)
    part_section = db.Column(db.String(10), nullable=False)
    part_order_in_test = db.Column(db.Integer, nullable=False)

    def __repr__(self):
        return f"<Part {self.part_id}: {self.part_code}>"

    def to_dict(self):
        return {
            "part_id": self.part_id,
            "part_code": self.part_code,
            "part_name": self.part_name,
            "part_section": self.part_section,
            "part_order_in_test": self.part_order_in_test,
        }
