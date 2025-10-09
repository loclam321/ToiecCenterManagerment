from flask import Blueprint, request, jsonify
from app.services.room_service import RoomService
from app.utils.response_helper import (
    success_response,
    error_response,
    validation_error_response,
    not_found_response,
    created_response,
)

from app.config import db
from sqlalchemy import literal_column
from sqlalchemy.exc import OperationalError


room_bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")
room_service = RoomService()


@room_bp.route("/", methods=["GET"])
def get_rooms():
    """Lấy danh sách phòng với phân trang và lọc"""
    try:
        # Lấy parameters từ query string
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 10, type=int), 100)

        # Tạo filters dict
        filters = {}

        # Các filter parameters
        if request.args.get("room_status"):
            filters["room_status"] = request.args.get("room_status")
        if request.args.get("room_type"):
            filters["room_type"] = request.args.get("room_type")
        if request.args.get("min_capacity"):
            filters["min_capacity"] = request.args.get("min_capacity", type=int)
        if request.args.get("max_capacity"):
            filters["max_capacity"] = request.args.get("max_capacity", type=int)
        if request.args.get("room_location"):
            filters["room_location"] = request.args.get("room_location")
        if request.args.get("search"):
            filters["search"] = request.args.get("search")
        if request.args.get("available_only"):
            filters["available_only"] = request.args.get("available_only", type=bool)

        # Sorting
        if request.args.get("sort_by"):
            filters["sort_by"] = request.args.get("sort_by")
        if request.args.get("sort_order"):
            filters["sort_order"] = request.args.get("sort_order")

        result = room_service.get_all_rooms(
            page=page, per_page=per_page, filters=filters
        )

        if result["success"]:
            return success_response(result["data"], result.get("pagination"))
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error retrieving rooms: {str(e)}")


@room_bp.route("/<int:room_id>", methods=["GET"])
def get_room_by_id(room_id):
    """Lấy thông tin chi tiết một phòng"""
    try:
        result = room_service.get_room_by_id(room_id)

        if result["success"]:
            return success_response(result["data"])
        else:
            return not_found_response(result["error"])

    except Exception as e:
        return error_response(f"Error retrieving room: {str(e)}")


@room_bp.route("/", methods=["POST"])
def create_room():
    """Tạo phòng mới"""
    try:
        data = request.get_json()

        # Validation đơn giản
        if not data.get("room_name") or not data.get("room_name").strip():
            return validation_error_response({"room_name": "Room name is required"})

        if data.get("room_capacity") and (
            not isinstance(data.get("room_capacity"), int)
            or data.get("room_capacity") < 1
        ):
            return validation_error_response(
                {"room_capacity": "Room capacity must be a positive integer"}
            )

        result = room_service.create_room(data)

        if result["success"]:
            # Sử dụng created_response thay vì success_response với status_code
            return created_response(result["data"], message="Room created successfully")
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error creating room: {str(e)}")


@room_bp.route("/<int:room_id>", methods=["PUT"])
def update_room(room_id):
    """Cập nhật thông tin phòng"""
    try:
        data = request.get_json()

        # Validation cho room_capacity nếu có
        if "room_capacity" in data and data["room_capacity"] is not None:
            if not isinstance(data["room_capacity"], int) or data["room_capacity"] < 1:
                return validation_error_response(
                    {"room_capacity": "Room capacity must be a positive integer"}
                )

        result = room_service.update_room(room_id, data)

        if result["success"]:
            return success_response(result["data"], message="Room updated successfully")
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error updating room: {str(e)}")


@room_bp.route("/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    """Xóa phòng"""
    try:
        result = room_service.delete_room(room_id)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error deleting room: {str(e)}")


@room_bp.route("/available", methods=["GET"])
def get_available_rooms():
    """Lấy danh sách phòng có sẵn"""
    try:
        min_capacity = request.args.get("min_capacity", type=int)
        result = room_service.get_available_rooms(min_capacity)

        if result["success"]:
            return success_response(result["data"])
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error retrieving available rooms: {str(e)}")


@room_bp.route("/search", methods=["GET"])
def search_rooms():
    """Tìm kiếm phòng"""
    try:
        search_term = request.args.get("q", "").strip()

        if not search_term:
            return validation_error_response({"search": "Search term is required"})

        result = room_service.search_rooms(search_term)

        if result["success"]:
            return success_response(result["data"])
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error searching rooms: {str(e)}")


@room_bp.route("/statistics", methods=["GET"])
def get_room_statistics():
    """Lấy thống kê tổng quan về phòng"""
    try:
        result = room_service.get_room_statistics()

        if result["success"]:
            return success_response(result["data"])
        else:
            return error_response(result["error"])

    except Exception as e:
        return error_response(f"Error retrieving room statistics: {str(e)}")


# Health check endpoint
@room_bp.route("/health", methods=["GET"])
def health_check():
    """Kiểm tra tình trạng hoạt động của room service"""
    try:
        # Test database connection
        db.session.execute(literal_column("1"))
        return success_response({"status": "healthy", "service": "room_service"})
    except OperationalError:
        response = error_response("Database connection failed")
        response.status_code = 503
        return response
    except Exception as e:
        response = error_response(f"Service unhealthy: {str(e)}")
        response.status_code = 503
        return response


# Error handlers for this blueprint
@room_bp.errorhandler(404)
def room_not_found(error):
    return not_found_response("Room endpoint not found")


@room_bp.errorhandler(405)
def method_not_allowed(error):
    response = error_response("Method not allowed")
    response.status_code = 405
    return response


@room_bp.errorhandler(500)
def internal_server_error(error):
    response = error_response("Internal server error")
    response.status_code = 500
    return response
