from app.config import db
from sqlalchemy import func
from .learning_path_model import LearningPath


class Skill(db.Model):
    __tablename__ = "skills"  # Số nhiều theo quy ước

    sk_id = db.Column(db.Integer, primary_key=True, nullable=False)
    lp_id = db.Column(db.Integer, db.ForeignKey('learning_paths.lp_id'), nullable=False)
    sk_name = db.Column(db.String(100), nullable=True)
    sk_description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    # Relationship với LearningPath
    learning_path = db.relationship('LearningPath', backref=db.backref('skills', lazy=True))

    def __repr__(self):
        return f"<Skill {self.sk_id}: {self.sk_name}>"

    def to_dict(self):
        """Chuyển đổi skill thành dict để trả về qua API"""
        return {
            'sk_id': self.sk_id,
            'lp_id': self.lp_id,
            'sk_name': self.sk_name,
            'sk_description': self.sk_description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin liên quan đến learning path
            'lp_name': self.learning_path.lp_name if self.learning_path else None
        }

    @property
    def learning_path_name(self):
        """Getter để lấy tên learning path"""
        return self.learning_path.lp_name if self.learning_path else None