from app.config import db
from .part_model import Part


class Item(db.Model):
    __tablename__ = "ITEM"

    item_id = db.Column("ITEM_ID", db.Integer, primary_key=True, nullable=False)
    part_id = db.Column(
        "PART_ID",
        db.Integer,
        db.ForeignKey("PART.PART_ID", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
    )
    item_group_key = db.Column("ITEM_GROUP_KEY", db.String(50))
    item_stimulus_text = db.Column("ITEM_STIMULUS_TEXT", db.Text)
    item_question_text = db.Column("ITEM_QUESTION_TEXT", db.Text)
    item_image_path = db.Column("ITEM_IMAGE_PATH", db.String(255))
    item_audio_path = db.Column("ITEM_AUDIO_PATH", db.String(255))
    item_order_in_part = db.Column("ITEM_ORDER_IN_PART", db.Integer, nullable=False)

    part = db.relationship("Part", backref=db.backref("items", lazy=True))

    def __repr__(self):
        return f"<Item {self.item_id} in Part {self.part_id}>"

    def to_dict(self):
        return {
            "item_id": self.item_id,
            "part_id": self.part_id,
            "item_group_key": self.item_group_key,
            "item_stimulus_text": self.item_stimulus_text,
            "item_question_text": self.item_question_text,
            "item_image_path": self.item_image_path,
            "item_audio_path": self.item_audio_path,
            "item_order_in_part": self.item_order_in_part,
        }