from app.config import db
from sqlalchemy import func
from datetime import date


class User(db.Model):
    """Base User model cho các loại user khác nhau"""
    __tablename__ = "users"
    
    user_id = db.Column(db.String(10), primary_key=True)
    user_name = db.Column(db.String(100))
    user_password = db.Column(db.String(255))
    user_gender = db.Column(db.String(1))
    user_email = db.Column(db.String(100))
    user_birthday = db.Column(db.Date)
    user_telephone = db.Column(db.String(15))
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Discriminator column cho polymorphic inheritance
    user_type = db.Column(db.String(20))
    
    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': user_type
    }
    
    def __repr__(self):
        return f"<User {self.user_id}: {self.user_name}>"
    
    def to_dict(self):
        """Chuyển đổi user thành dict để trả về qua API"""
        return {
            'user_id': self.user_id,
            'user_name': self.user_name,
            'user_gender': self.user_gender,
            'user_email': self.user_email,
            'user_birthday': self.user_birthday.strftime('%Y-%m-%d') if self.user_birthday else None,
            'user_telephone': self.user_telephone,
            'user_type': self.user_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def get_age(self):
        """Tính tuổi dựa trên ngày sinh"""
        if not self.user_birthday:
            return None
        
        today = date.today()
        return today.year - self.user_birthday.year - ((today.month, today.day) < (self.user_birthday.month, self.user_birthday.day))
    
    def set_password(self, password):
        """Hash và lưu mật khẩu"""
        # Ví dụ dùng werkzeug để hash password
        from werkzeug.security import generate_password_hash
        self.user_password = generate_password_hash(password)
    
    def check_password(self, password):
        """Kiểm tra mật khẩu"""
        from werkzeug.security import check_password_hash
        return check_password_hash(self.user_password, password)