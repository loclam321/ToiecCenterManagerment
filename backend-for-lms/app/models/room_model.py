from app.config import db
from sqlalchemy import func


class Room(db.Model):
    """Model cho bảng ROOM"""
    __tablename__ = "rooms"
    
    room_id = db.Column(db.Integer, primary_key=True, nullable=False)
    
    # Các trường bổ sung hữu ích (không có trong schema gốc)
    room_name = db.Column(db.String(50), nullable=True)
    room_capacity = db.Column(db.Integer, nullable=True)
    room_type = db.Column(db.String(50), nullable=True)  # classroom, lab, etc.
    room_location = db.Column(db.String(100), nullable=True)
    room_status = db.Column(db.String(20), default="AVAILABLE")  # AVAILABLE, MAINTENANCE, etc.
    
    # Thêm các trường tracking
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        room_name = self.room_name or f"Room {self.room_id}"
        return f"<Room {self.room_id}: {room_name}>"
    
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            "room_id": self.room_id,
            "room_name": self.room_name,
            "room_capacity": int(self.room_capacity) if self.room_capacity is not None else None,
            "room_type": self.room_type,
            "room_location": self.room_location,
            "room_status": self.room_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def is_available(self):
        """Kiểm tra phòng có sẵn sàng sử dụng không"""
        return self.room_status == "AVAILABLE"
    
    @classmethod
    def get_available_rooms(cls):
        """Lấy danh sách các phòng đang sẵn sàng sử dụng"""
        return cls.query.filter_by(room_status="AVAILABLE").all()
    
    @classmethod
    def find_rooms_by_capacity(cls, min_capacity):
        """Tìm phòng theo sức chứa tối thiểu"""
        return cls.query.filter(cls.room_capacity >= min_capacity).order_by(cls.room_capacity).all()