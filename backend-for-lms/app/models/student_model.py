import enum
from app.config import db
from sqlalchemy import func
from datetime import date
from werkzeug.security import generate_password_hash, check_password_hash


class Student(db.Model):
    """Model cho bảng STUDENT - không sử dụng kế thừa"""
    __tablename__ = "students"
    
    # Các trường từ schema
    user_id = db.Column(db.String(10), primary_key=True, nullable=False)
    user_name = db.Column(db.String(100), nullable=True)
    user_password = db.Column(db.String(255), nullable=True)
    user_gender = db.Column(db.String(1), nullable=True)
    user_email = db.Column(db.String(100), nullable=True)
    user_birthday = db.Column(db.Date, nullable=True)
    user_telephone = db.Column(db.String(15), nullable=True)
    sd_startlv = db.Column(
        db.Enum("300–450", "450–600", "600–750", "750–900", name="student_levels"),
        nullable=True
    )  # Cấp độ bắt đầu
    sd_enrollmenttdate = db.Column(db.Date, nullable=True)  # Ngày đăng ký
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Chỉ cần một trường xác thực email
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<Student {self.user_id}: {self.user_name}>"
    
    def to_dict(self):
        """Chuyển đổi student thành dict để trả về qua API"""
        return {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'user_gender': self.user_gender,
            'user_email': self.user_email,
            'user_birthday': self.user_birthday.strftime('%Y-%m-%d') if self.user_birthday else None,
            'user_telephone': self.user_telephone,
            'sd_startlv': self.sd_startlv,
            'sd_enrollmenttdate': self.sd_enrollmenttdate.strftime('%Y-%m-%d') if self.sd_enrollmenttdate else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def set_password(self, password):
        """Hash và lưu mật khẩu"""
        self.user_password = generate_password_hash(password)
    
    def check_password(self, password):
        """Kiểm tra mật khẩu"""
        return check_password_hash(self.user_password, password)
    
    def get_age(self):
        """Tính tuổi dựa trên ngày sinh"""
        if not self.user_birthday:
            return None
        
        today = date.today()
        return today.year - self.user_birthday.year - ((today.month, today.day) < (self.user_birthday.month, self.user_birthday.day))
    
    def get_enrollment_duration(self):
        """Tính thời gian đã đăng ký học (tính theo ngày)"""
        if not self.sd_enrollmenttdate:
            return 0
        
        return (date.today() - self.sd_enrollmenttdate).days
    
    def is_new_student(self):
        """Kiểm tra xem có phải học viên mới không (đăng ký trong vòng 30 ngày)"""
        if not self.sd_enrollmenttdate:
            return False
        
        return (date.today() - self.sd_enrollmenttdate).days <= 30