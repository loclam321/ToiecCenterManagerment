from typing import Dict, Any, Optional, List
from datetime import datetime, date
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, or_

from app.config import db
from app.models.room_model import Room


class RoomService:
    """Service xử lý business logic cho Room"""

    def __init__(self, database=None):
        self.db = database or db

    def _generate_room_id(self) -> int:
        """Tạo room_id tự động (auto increment, trả về số cuối cùng + 1)"""
        last_room = self.db.session.query(func.max(Room.room_id)).scalar()
        if not last_room:
            return 1
        return last_room + 1

    def get_all_rooms(
        self, page: int = 1, per_page: int = 10, filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Lấy danh sách phòng với phân trang, lọc và sắp xếp

        Args:
            page: Trang hiện tại
            per_page: Số lượng bản ghi trên mỗi trang
            filters: Dict chứa các tham số lọc và sắp xếp
        """
        try:
            query = Room.query

            # Xử lý các filter nếu có
            if filters:
                # Filter theo status
                if filters.get("room_status"):
                    query = query.filter(Room.room_status == filters["room_status"])

                # Filter theo type
                if filters.get("room_type"):
                    query = query.filter(Room.room_type == filters["room_type"])

                # Filter theo capacity (tối thiểu)
                if filters.get("min_capacity"):
                    query = query.filter(Room.room_capacity >= filters["min_capacity"])

                # Filter theo capacity (tối đa)
                if filters.get("max_capacity"):
                    query = query.filter(Room.room_capacity <= filters["max_capacity"])

                # Filter theo location
                if filters.get("room_location"):
                    query = query.filter(
                        Room.room_location.like(f"%{filters['room_location']}%")
                    )

                # Filter theo tên (tìm kiếm)
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(
                        or_(
                            Room.room_name.like(search_term),
                            Room.room_location.like(search_term),
                            Room.room_type.like(search_term),
                        )
                    )

                # Chỉ lấy phòng available
                if filters.get("available_only"):
                    query = query.filter(Room.room_status == "AVAILABLE")

                # Xử lý sắp xếp
                sort_by = filters.get("sort_by", "room_id")
                sort_order = filters.get("sort_order", "asc")

                # Đảm bảo sort_by là tên cột hợp lệ
                valid_sort_columns = [
                    "room_id",
                    "room_name",
                    "room_capacity",
                    "room_type",
                    "room_location",
                    "room_status",
                    "created_at",
                    "updated_at",
                ]

                if sort_by in valid_sort_columns:
                    column = getattr(Room, sort_by)
                    if sort_order.lower() == "desc":
                        query = query.order_by(column.desc())
                    else:
                        query = query.order_by(column.asc())
                else:
                    query = query.order_by(Room.room_id.asc())
            else:
                query = query.order_by(Room.room_id.asc())

            # Phân trang
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)

            return {
                "success": True,
                "data": [room.to_dict() for room in pagination.items],
                "pagination": {
                    "total": pagination.total,
                    "pages": pagination.pages,
                    "page": page,
                    "per_page": per_page,
                    "has_next": pagination.has_next,
                    "has_prev": pagination.has_prev,
                },
            }

        except Exception as e:
            current_app.logger.error(f"Error in get_all_rooms: {str(e)}")
            return {"success": False, "error": f"Error retrieving rooms: {str(e)}"}

    def get_room_by_id(self, room_id: int) -> Dict[str, Any]:
        """Lấy thông tin chi tiết một phòng"""
        try:
            room = Room.query.get(room_id)
            if not room:
                return {"success": False, "error": "Room not found"}
            return {"success": True, "data": room.to_dict()}
        except Exception as e:
            current_app.logger.error(f"Error getting room by id: {str(e)}")
            return {"success": False, "error": str(e)}

    def create_room(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Tạo phòng mới"""
        try:
            print(payload)
            # Validate dữ liệu đầu vào
            if not payload.get("room_name"):
                return {"success": False, "error": "Room name is required"}
            room = Room(
                room_id=self._generate_room_id(),
                room_name=payload.get("room_name"),
                room_capacity=payload.get("room_capacity"),
                room_type=payload.get("room_type"),
                room_location=payload.get("room_location"),
                room_status=payload.get("room_status", "AVAILABLE"),
            )
            print(room)
            self.db.session.add(room)
            self.db.session.commit()
            return {"success": True, "data": room.to_dict()}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error creating room: {exc}")
            return {"success": False, "error": "Duplicate room data"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error creating room")
            return {"success": False, "error": str(exc)}

    def update_room(self, room_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Cập nhật thông tin phòng"""
        try:
            room = Room.query.get(room_id)
            if not room:
                return {"success": False, "error": "Room not found"}

            # Cập nhật các trường
            updatable_fields = [
                "room_name",
                "room_capacity",
                "room_type",
                "room_location",
                "room_status",
            ]

            for field in updatable_fields:
                if field in payload:
                    setattr(room, field, payload[field])

            self.db.session.commit()
            return {"success": True, "data": room.to_dict()}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error updating room: {exc}")
            return {"success": False, "error": "Duplicate room data"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error updating room")
            return {"success": False, "error": str(exc)}

    def delete_room(self, room_id: int) -> Dict[str, Any]:
        """Xóa phòng"""
        try:
            room = Room.query.get(room_id)
            if not room:
                return {"success": False, "error": "Room not found"}

            self.db.session.delete(room)
            self.db.session.commit()
            return {"success": True, "message": "Room deleted successfully"}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error deleting room: {exc}")
            return {
                "success": False,
                "error": "Cannot delete room due to foreign key constraint",
            }
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error deleting room")
            return {"success": False, "error": str(exc)}

    def get_available_rooms(self, min_capacity: Optional[int] = None) -> Dict[str, Any]:
        """Lấy danh sách phòng có sẵn"""
        try:
            query = Room.query.filter_by(room_status="AVAILABLE")

            if min_capacity:
                query = query.filter(Room.room_capacity >= min_capacity)

            rooms = query.order_by(Room.room_capacity.asc()).all()

            return {"success": True, "data": [room.to_dict() for room in rooms]}
        except Exception as e:
            current_app.logger.error(f"Error getting available rooms: {str(e)}")
            return {"success": False, "error": str(e)}

    def find_rooms_by_capacity(
        self, min_capacity: int, max_capacity: Optional[int] = None
    ) -> Dict[str, Any]:
        """Tìm phòng theo khoảng sức chứa"""
        try:
            query = Room.query.filter(Room.room_capacity >= min_capacity)

            if max_capacity:
                query = query.filter(Room.room_capacity <= max_capacity)

            rooms = query.order_by(Room.room_capacity.asc()).all()

            return {"success": True, "data": [room.to_dict() for room in rooms]}
        except Exception as e:
            current_app.logger.error(f"Error finding rooms by capacity: {str(e)}")
            return {"success": False, "error": str(e)}

    def find_rooms_by_type(self, room_type: str) -> Dict[str, Any]:
        """Tìm phòng theo loại"""
        try:
            rooms = Room.query.filter_by(room_type=room_type).all()

            return {"success": True, "data": [room.to_dict() for room in rooms]}
        except Exception as e:
            current_app.logger.error(f"Error finding rooms by type: {str(e)}")
            return {"success": False, "error": str(e)}

    def find_rooms_by_location(self, location: str) -> Dict[str, Any]:
        """Tìm phòng theo địa điểm"""
        try:
            rooms = Room.query.filter(Room.room_location.like(f"%{location}%")).all()

            return {"success": True, "data": [room.to_dict() for room in rooms]}
        except Exception as e:
            current_app.logger.error(f"Error finding rooms by location: {str(e)}")
            return {"success": False, "error": str(e)}

    def update_room_status(self, room_id: int, new_status: str) -> Dict[str, Any]:
        """Cập nhật trạng thái phòng"""
        try:
            valid_statuses = [
                "AVAILABLE",
                "MAINTENANCE",
                "OCCUPIED",
                "RESERVED",
                "OUT_OF_ORDER",
            ]

            if new_status not in valid_statuses:
                return {
                    "success": False,
                    "error": f"Invalid status. Valid options: {valid_statuses}",
                }

            room = Room.query.get(room_id)
            if not room:
                return {"success": False, "error": "Room not found"}

            room.room_status = new_status
            self.db.session.commit()

            return {"success": True, "data": room.to_dict()}

        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Error updating room status")
            return {"success": False, "error": str(exc)}

    def get_room_statistics(self) -> Dict[str, Any]:
        """Lấy thống kê tổng quan về phòng"""
        try:
            total_rooms = Room.query.count()
            available_rooms = Room.query.filter_by(room_status="AVAILABLE").count()
            maintenance_rooms = Room.query.filter_by(room_status="MAINTENANCE").count()
            occupied_rooms = Room.query.filter_by(room_status="OCCUPIED").count()

            # Thống kê theo loại phòng
            room_types = (
                self.db.session.query(
                    Room.room_type, func.count(Room.room_id).label("count")
                )
                .group_by(Room.room_type)
                .all()
            )

            # Thống kê theo sức chứa
            avg_capacity = self.db.session.query(func.avg(Room.room_capacity)).scalar()
            max_capacity = self.db.session.query(func.max(Room.room_capacity)).scalar()
            min_capacity = self.db.session.query(func.min(Room.room_capacity)).scalar()

            return {
                "success": True,
                "data": {
                    "total_rooms": total_rooms,
                    "status_breakdown": {
                        "available": available_rooms,
                        "maintenance": maintenance_rooms,
                        "occupied": occupied_rooms,
                        "other": total_rooms
                        - available_rooms
                        - maintenance_rooms
                        - occupied_rooms,
                    },
                    "room_types": [
                        {"type": rt.room_type, "count": rt.count} for rt in room_types
                    ],
                    "capacity_stats": {
                        "average": float(avg_capacity) if avg_capacity else 0,
                        "maximum": max_capacity or 0,
                        "minimum": min_capacity or 0,
                    },
                },
            }
        except Exception as e:
            current_app.logger.error(f"Error getting room statistics: {str(e)}")
            return {"success": False, "error": str(e)}

    def bulk_update_status(
        self, room_ids: List[int], new_status: str
    ) -> Dict[str, Any]:
        """Cập nhật trạng thái cho nhiều phòng cùng lúc"""
        try:
            valid_statuses = [
                "AVAILABLE",
                "MAINTENANCE",
                "OCCUPIED",
                "RESERVED",
                "OUT_OF_ORDER",
            ]

            if new_status not in valid_statuses:
                return {
                    "success": False,
                    "error": f"Invalid status. Valid options: {valid_statuses}",
                }

            updated_count = Room.query.filter(Room.room_id.in_(room_ids)).update(
                {Room.room_status: new_status}, synchronize_session=False
            )

            self.db.session.commit()

            return {
                "success": True,
                "message": f"Updated status for {updated_count} rooms",
                "updated_count": updated_count,
            }

        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Error in bulk status update")
            return {"success": False, "error": str(exc)}

    def search_rooms(self, search_term: str) -> Dict[str, Any]:
        """Tìm kiếm phòng theo tên, loại hoặc địa điểm"""
        try:
            search_pattern = f"%{search_term}%"
            rooms = Room.query.filter(
                or_(
                    Room.room_name.like(search_pattern),
                    Room.room_type.like(search_pattern),
                    Room.room_location.like(search_pattern),
                )
            ).all()

            return {"success": True, "data": [room.to_dict() for room in rooms]}
        except Exception as e:
            current_app.logger.error(f"Error searching rooms: {str(e)}")
            return {"success": False, "error": str(e)}
