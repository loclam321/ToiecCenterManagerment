from app.config import db
from sqlalchemy import func
from datetime import datetime
from .skill_model import Skill


class Test(db.Model):
    __tablename__ = "tests"  # Số nhiều theo quy ước
    
    test_id = db.Column(db.Integer, primary_key=True, nullable=False)
    sk_id = db.Column(db.Integer, db.ForeignKey('skills.sk_id'), nullable=False)
    test_name = db.Column(db.String(100), nullable=True)
    test_description = db.Column(db.Text, nullable=True)
    test_total_score = db.Column(db.Numeric(5, 2), nullable=True)
    test_passing_score = db.Column(db.Numeric(5, 2), nullable=True)
    test_duration = db.Column(db.Integer, nullable=True)  # Thời gian làm bài (phút)
    test_starttime = db.Column(db.DateTime, nullable=True)
    test_endtime = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationship với Skill
    skill = db.relationship('Skill', backref=db.backref('tests', lazy=True))
    
    def __repr__(self):
        return f"<Test {self.test_id}: {self.test_name}>"
    
    def to_dict(self):
        """Chuyển đổi test thành dict để trả về qua API"""
        return {
            'test_id': self.test_id,
            'sk_id': self.sk_id,
            'test_name': self.test_name,
            'test_description': self.test_description,
            'test_total_score': float(self.test_total_score) if self.test_total_score is not None else None,
            'test_passing_score': float(self.test_passing_score) if self.test_passing_score is not None else None,
            'test_duration': self.test_duration,
            'test_starttime': self.test_starttime.isoformat() if self.test_starttime else None,
            'test_endtime': self.test_endtime.isoformat() if self.test_endtime else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin liên quan
            'skill_name': self.skill.sk_name if self.skill else None,
            'learning_path_id': self.skill.lp_id if self.skill else None
        }
    
    def is_active(self):
        """Kiểm tra bài test có đang active không"""
        now = datetime.now()
        if not self.test_starttime or not self.test_endtime:
            return False
        return self.test_starttime <= now <= self.test_endtime
    
    def is_upcoming(self):
        """Kiểm tra bài test có sắp diễn ra không"""
        now = datetime.now()
        if not self.test_starttime:
            return False
        return now < self.test_starttime
    
    def is_completed(self):
        """Kiểm tra bài test đã kết thúc chưa"""
        now = datetime.now()
        if not self.test_endtime:
            return False
        return now > self.test_endtime
    
    def get_passing_percentage(self):
        """Tính phần trăm điểm để pass"""
        if not self.test_total_score or not self.test_passing_score or float(self.test_total_score) == 0:
            return None
        return (float(self.test_passing_score) / float(self.test_total_score)) * 100
    
    @property
    def skill_name(self):
        """Getter để lấy tên skill"""
        return self.skill.sk_name if self.skill else None