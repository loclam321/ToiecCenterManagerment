from typing import Dict, Any, Optional
from datetime import datetime, date
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.config import db
from app.models.room_model import Room

class RoomService:
    def __init__(self, database=None):
        self.db = database or db
        
        
    def _generate_room_id(self) -> str:
        last_id = self.db.session.query(func.max(Room.room_id)).scalar()
        if not last_id:
            return "R0000001"
        return f"R{int(last_id[1:]) + 1:07d}"
    
    
    def get_all_rooms(self) -> Dict[str, Any]:
        try:
            rooms = Room.query.all()
            return [room.to_dict() for room in rooms]
        except Exception as e:
            current_app.logger.error(f"Error fetching rooms: {e}")
            return []