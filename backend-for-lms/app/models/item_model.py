from app.config import db
from .part_model import Part
from .test_model import Test


class Item(db.Model):
    __tablename__ = "items"

    item_id = db.Column(db.Integer, primary_key=True, nullable=False)
    part_id = db.Column(
        db.Integer,
        db.ForeignKey(
            f"{Part.__tablename__}.part_id", ondelete="RESTRICT", onupdate="RESTRICT"
        ),
        nullable=False,
    )
    test_id = db.Column(
        db.Integer,
        db.ForeignKey(
            f"{Test.__tablename__}.test_id", ondelete="RESTRICT", onupdate="RESTRICT"
        ),
        nullable=True,
    )
    item_group_key = db.Column(db.String(50))
    item_stimulus_text = db.Column(db.Text)
    item_question_text = db.Column(db.Text)
    item_image_path = db.Column(db.String(255))
    item_audio_path = db.Column(db.String(255))
    item_order_in_part = db.Column(db.Integer, nullable=False)

    part = db.relationship("Part", backref=db.backref("items", lazy=True))
    test = db.relationship("Test", backref=db.backref("items", lazy=True))

    def __repr__(self):
        return f"<Item {self.item_id} in Part {self.part_id}>"

    def to_dict(self):
        return {
            "item_id": self.item_id,
            "part_id": self.part_id,
            "test_id": self.test_id,
            "item_group_key": self.item_group_key,
            "item_stimulus_text": self.item_stimulus_text,
            "item_question_text": self.item_question_text,
            "item_image_path": self.item_image_path,
            "item_audio_path": self.item_audio_path,
            "item_order_in_part": self.item_order_in_part,
        }
