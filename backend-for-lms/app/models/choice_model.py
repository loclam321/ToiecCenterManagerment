from app.config import db
from .item_model import Item


class Choice(db.Model):
    __tablename__ = "choices"

    choice_id = db.Column(db.Integer, primary_key=True, nullable=False)
    item_id = db.Column(
        db.Integer,
        db.ForeignKey(f"{Item.__tablename__}.item_id", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
    )
    choice_label = db.Column(db.String(1), nullable=False)
    choice_content = db.Column(db.Text, nullable=False)
    choice_is_correct = db.Column(db.Boolean, nullable=False)

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
