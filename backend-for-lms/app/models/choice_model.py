from app.config import db
from .item_model import Item


class Choice(db.Model):
    __tablename__ = "CHOICE"

    choice_id = db.Column("CHOICE_ID", db.Integer, primary_key=True, nullable=False)
    item_id = db.Column(
        "ITEM_ID",
        db.Integer,
        db.ForeignKey("ITEM.ITEM_ID", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
    )
    choice_label = db.Column("CHOICE_LABEL", db.String(1), nullable=False)
    choice_content = db.Column("CHOICE_CONTENT", db.Text, nullable=False)
    choice_is_correct = db.Column("CHOICE_IS_CORRECT", db.Boolean, nullable=False)

    item = db.relationship("Item", backref=db.backref("choices", lazy=True))

    def __repr__(self):
        return f"<Choice {self.choice_id} for Item {self.item_id}>"

    def to_dict(self):
        return {
            "choice_id": self.choice_id,
            "item_id": self.item_id,
            "choice_label": self.choice_label,
            "choice_content": self.choice_content,
            "choice_is_correct": self.choice_is_correct,
        }
