from app.config import db
from sqlalchemy import Enum


class Test(db.Model):
    __tablename__ = "tests"

    test_id = db.Column(db.Integer, primary_key=True, nullable=False)
    test_name = db.Column(db.String(100), nullable=True)
    test_description = db.Column(db.Text, nullable=True)
    test_duration_min = db.Column(db.Integer, nullable=True)

    # ✅ SỬA: Từ DateTime thành Integer (số lượng câu hỏi)
    test_total_questions = db.Column(db.Integer, nullable=True)

    # ✅ SỬA: Từ DateTime thành String (trạng thái: ACTIVE, INACTIVE, DRAFT, etc.)
    test_status = db.Column(db.String(20), nullable=True, default="DRAFT")

    # Hoặc dùng Enum cho test_status nếu muốn chặt chẽ hơn:
    # test_status = db.Column(
    #     Enum('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', name='test_status_enum'),
    #     nullable=True,
    #     default='DRAFT'
    # )

    def __repr__(self):
        return f"<Test {self.test_id}: {self.test_name}>"

    def to_dict(self):
        """Chuyển đổi Test object thành dictionary"""
        return {
            "test_id": self.test_id,
            "test_name": self.test_name,
            "test_description": self.test_description,
            "test_duration_min": self.test_duration_min,
            "test_total_questions": self.test_total_questions,  # Integer
            "test_status": self.test_status,  # String
        }
