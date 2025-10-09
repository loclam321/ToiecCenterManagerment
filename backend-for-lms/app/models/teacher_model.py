from app.config import db
import re
from sqlalchemy import func
from datetime import date
from werkzeug.security import generate_password_hash, check_password_hash


class Teacher(db.Model):
    """Model cho bảng TEACHER - không sử dụng kế thừa"""
    __tablename__ = "teachers"
    
    # Các trường từ schema
    user_id = db.Column(db.String(10), primary_key=True, nullable=False)
    user_name = db.Column(db.String(100), nullable=True)
    user_password = db.Column(db.String(255), nullable=True)
    user_gender = db.Column(db.String(1), nullable=True)
    user_email = db.Column(db.String(100), nullable=True)
    user_birthday = db.Column(db.Date, nullable=True)
    user_telephone = db.Column(db.String(15), nullable=True)
    tch_specialization = db.Column(db.String(100), nullable=True)  # Chuyên môn
    tch_qualification = db.Column(db.String(100), nullable=True)   # Bằng cấp/Chứng chỉ
    tch_hire_date = db.Column(db.Date, nullable=True)             # Ngày tuyển dụng
    tch_avtlink = db.Column(db.String(255), nullable=True)  # Liên kết đến trang cá nhân hoặc hồ sơ
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Teacher {self.user_id}: {self.user_name}>"
    
    def _avatar_web_path(self):
        """Normalize stored tch_avtlink to a web path served by frontend (e.g. /avatar/3.jpg)."""
        if not self.tch_avtlink:
            return None
        p = str(self.tch_avtlink).strip().replace('\\', '/')
        low = p.lower()

        # If already absolute URL or data URI, return as-is
        if low.startswith('http://') or low.startswith('https://') or low.startswith('data:'):
            return p

        # Prefer substring starting at /avatar/
        ia = low.find('/avatar/')
        if ia != -1:
            p = p[ia:]
        else:
            # If contains /public/, strip everything up to and including /public
            ip = low.find('/public/')
            if ip != -1:
                p = p[ip + len('/public'):]

        if not p.startswith('/'):
            p = '/' + p
        # Collapse duplicate slashes
        p = re.sub(r'/+', '/', p)
        return p

    def to_dict(self):
        """Chuyển đổi teacher thành dict để trả về qua API"""
        return {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'user_gender': self.user_gender,
            'user_email': self.user_email,
            'user_birthday': self.user_birthday.strftime('%Y-%m-%d') if self.user_birthday else None,
            'user_telephone': self.user_telephone,
            'tch_specialization': self.tch_specialization,
            'tch_qualification': self.tch_qualification,
            'tch_hire_date': self.tch_hire_date.strftime('%Y-%m-%d') if self.tch_hire_date else None,
            # Return normalized avatar path for frontend consumption
            'tch_avtlink': self._avatar_web_path(),
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
    
    def get_years_of_service(self):
        """Tính số năm công tác"""
        if not self.tch_hire_date:
            return 0
        
        today = date.today()
        years = today.year - self.tch_hire_date.year
        
        # Kiểm tra nếu chưa đến ngày kỷ niệm năm nay
        if (today.month, today.day) < (self.tch_hire_date.month, self.tch_hire_date.day):
            years -= 1
            
        return max(0, years)
    
    def is_senior_teacher(self):
        """Kiểm tra giáo viên có phải là giáo viên thâm niên (> 5 năm)"""
        return self.get_years_of_service() > 5