from app.config import db
from sqlalchemy import func
from .course_model import Course


class LearningPath(db.Model):
    __tablename__ = "learning_paths"  # Số nhiều theo quy ước

    lp_id = db.Column(db.Integer, primary_key=True, nullable=False)
    course_id = db.Column(db.String(10), db.ForeignKey('courses.course_id'), nullable=False)
    lp_name = db.Column(db.String(100), nullable=True)
    lp_desciption = db.Column(db.Text, nullable=True)  # Giữ nguyên tên trường như SQL
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    # Relationship với Course
    course = db.relationship('Course', backref=db.backref('learning_paths', lazy=True))

    def __repr__(self):
        return f"<LearningPath {self.lp_id}: {self.lp_name}>"

    def to_dict(self):
        """Chuyển đổi learning path thành dict để trả về qua API"""
        return {
            'lp_id': self.lp_id,
            'course_id': self.course_id,
            'lp_name': self.lp_name,
            'lp_desciption': self.lp_desciption,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thêm thông tin course nếu cần
            'course_name': self.course.course_name if self.course else None
        }