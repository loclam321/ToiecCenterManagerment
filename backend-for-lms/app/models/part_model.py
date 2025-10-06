from app.config import db


class Part(db.Model):
    __tablename__ = "PART"

    part_id = db.Column("PART_ID", db.Integer, primary_key=True, nullable=False)
    part_code = db.Column("PART_CODE", db.String(10), nullable=False)
    part_name = db.Column("PART_NAME", db.String(10), nullable=False)
    part_section = db.Column("PART_SECTION", db.String(10), nullable=False)
    part_order_in_test = db.Column("PART_ORDER_IN_TEST", db.Integer, nullable=False)

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
