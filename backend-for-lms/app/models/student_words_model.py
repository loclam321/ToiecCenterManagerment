from app.config import db
from sqlalchemy import func
from datetime import datetime
from .student_model import Student
from .words_model import Word


class StudentWords(db.Model):
    """Model cho bảng RELATIONSHIP_16 - liên kết giữa Student và Words"""
    __tablename__ = "student_words"  # Đổi tên từ RELATIONSHIP_16 thành student_words
    
    # Composite primary key
    user_id = db.Column(db.String(10), db.ForeignKey('students.user_id'), primary_key=True)
    w_index = db.Column(db.Integer, db.ForeignKey('words.w_index'), primary_key=True)
    
    # Thêm các trường bổ sung có ích
    learned_date = db.Column(db.DateTime(timezone=True), server_default=func.now())
    proficiency_level = db.Column(db.Integer, default=0)  # Mức độ thành thạo: 0-5
    last_reviewed = db.Column(db.DateTime(timezone=True))  # Thời gian ôn tập gần nhất
    
    # Relationships
    student = db.relationship('Student', backref=db.backref('student_words', lazy=True))
    word = db.relationship('Word', backref=db.backref('student_words', lazy=True))
    
    def __repr__(self):
        return f"<StudentWord: Student {self.user_id}, Word {self.w_index}>"
    
    def to_dict(self):
        """Chuyển đổi student_word thành dict để trả về qua API"""
        return {
            'user_id': self.user_id,
            'w_index': self.w_index,
            'learned_date': self.learned_date.isoformat() if self.learned_date else None,
            'proficiency_level': self.proficiency_level,
            'last_reviewed': self.last_reviewed.isoformat() if self.last_reviewed else None,
            # Thông tin từ word
            'word_english': self.word.w_english if self.word else None,
            'word_vietnamese': self.word.w_vietnamese if self.word else None
        }
    
    def update_proficiency(self, correct_answer):
        """Cập nhật mức độ thành thạo dựa trên câu trả lời"""
        if correct_answer:
            # Tăng mức độ thành thạo nếu trả lời đúng, tối đa là 5
            self.proficiency_level = min(5, self.proficiency_level + 1)
        else:
            # Giảm mức độ thành thạo nếu trả lời sai, tối thiểu là 0
            self.proficiency_level = max(0, self.proficiency_level - 1)
            
        self.last_reviewed = datetime.now()
        db.session.commit()
    
    @classmethod
    def get_student_vocabulary(cls, user_id):
        """Lấy toàn bộ từ vựng của học viên"""
        return cls.query.filter_by(user_id=user_id).all()
    
    @classmethod
    def get_words_to_review(cls, user_id, limit=10):
        """Lấy danh sách từ cần ôn tập (ưu tiên mức thành thạo thấp)"""
        return cls.query.filter_by(user_id=user_id).order_by(
            cls.proficiency_level.asc(), 
            cls.last_reviewed.asc().nullsfirst()
        ).limit(limit).all()
    
    @classmethod
    def mark_word_as_learned(cls, user_id, w_index):
        """Đánh dấu một từ là đã học"""
        student_word = cls.query.filter_by(user_id=user_id, w_index=w_index).first()
        
        if not student_word:
            student_word = cls(user_id=user_id, w_index=w_index)
            db.session.add(student_word)
            db.session.commit()
            return student_word
            
        return student_word