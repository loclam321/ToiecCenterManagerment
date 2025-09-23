from app.config import db
from sqlalchemy import func
from datetime import date, time
from .room_model import Room
from .class_model import Class
from .teacher_model import Teacher


class Schedule(db.Model):
    """Model cho bảng SCHEDULE - lịch học của các lớp"""
    __tablename__ = "schedules"
    
    schedule_id = db.Column(db.Integer, primary_key=True, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.room_id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.class_id'), nullable=False)
    user_id = db.Column(db.String(10), db.ForeignKey('teachers.user_id'), nullable=False)
    schedule_date = db.Column(db.Date, nullable=True)
    schedule_startime = db.Column(db.Time, nullable=True)  # Giữ nguyên tên như schema SQL
    schedule_endtime = db.Column(db.Time, nullable=True)   # Giữ nguyên tên như schema SQL
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    room = db.relationship('Room', backref=db.backref('schedules', lazy=True))
    class_obj = db.relationship('Class', backref=db.backref('schedules', lazy=True))  # class là từ khóa Python nên đổi tên
    teacher = db.relationship('Teacher', backref=db.backref('schedules', lazy=True))
    
    def __repr__(self):
        return f"<Schedule {self.schedule_id}: Class {self.class_id} on {self.schedule_date}>"
    
    def to_dict(self):
        """Chuyển đổi schedule thành dict để trả về qua API"""
        return {
            'schedule_id': self.schedule_id,
            'room_id': self.room_id,
            'class_id': self.class_id,
            'user_id': self.user_id,
            'schedule_date': self.schedule_date.strftime('%Y-%m-%d') if self.schedule_date else None,
            'schedule_startime': self.schedule_startime.strftime('%H:%M:%S') if self.schedule_startime else None,
            'schedule_endtime': self.schedule_endtime.strftime('%H:%M:%S') if self.schedule_endtime else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Thông tin liên quan
            'room_name': self.room.room_name if self.room and hasattr(self.room, 'room_name') else None,
            'class_name': self.class_obj.class_name if self.class_obj else None,
            'teacher_name': self.teacher.user_name if self.teacher else None
        }
    
    def is_today(self):
        """Kiểm tra lịch học có phải hôm nay không"""
        return self.schedule_date == date.today() if self.schedule_date else False
    
    def is_upcoming(self):
        """Kiểm tra lịch học có phải sắp tới không"""
        today = date.today()
        return self.schedule_date > today if self.schedule_date else False
    
    def is_past(self):
        """Kiểm tra lịch học đã qua chưa"""
        today = date.today()
        return self.schedule_date < today if self.schedule_date else False
    
    def get_duration_minutes(self):
        """Tính thời lượng của lịch học (phút)"""
        if not self.schedule_startime or not self.schedule_endtime:
            return 0
            
        # Tính số phút giữa schedule_endtime và schedule_startime
        start_minutes = self.schedule_startime.hour * 60 + self.schedule_startime.minute
        end_minutes = self.schedule_endtime.hour * 60 + self.schedule_endtime.minute
        
        duration = end_minutes - start_minutes
        return max(0, duration)  # Đảm bảo không âm
    
    @classmethod
    def get_schedules_by_date(cls, date_obj):
        """Lấy tất cả lịch học trong ngày cụ thể"""
        return cls.query.filter_by(schedule_date=date_obj).all()
    
    @classmethod
    def get_schedules_by_class(cls, class_id):
        """Lấy tất cả lịch học của một lớp"""
        return cls.query.filter_by(class_id=class_id).order_by(cls.schedule_date, cls.schedule_startime).all()
    
    @classmethod
    def get_schedules_by_teacher(cls, user_id):
        """Lấy tất cả lịch dạy của một giáo viên"""
        return cls.query.filter_by(user_id=user_id).order_by(cls.schedule_date, cls.schedule_startime).all()
    
    @classmethod
    def get_schedules_by_room(cls, room_id):
        """Lấy tất cả lịch học trong một phòng"""
        return cls.query.filter_by(room_id=room_id).order_by(cls.schedule_date, cls.schedule_startime).all()