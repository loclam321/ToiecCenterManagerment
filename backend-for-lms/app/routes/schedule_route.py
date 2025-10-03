from flask import Blueprint, request
from app.services.schedule_service import ScheduleService
from app.utils.response_helper import success_response, error_response
from flask_jwt_extended import jwt_required

schedule_bp = Blueprint("schedules", __name__, url_prefix="/api/schedules")
schedule_service = ScheduleService()


# Lấy lịch học theo ID
@schedule_bp.route("/<int:schedule_id>", methods=["GET"])
@jwt_required()
def get_schedule(schedule_id):
    result = schedule_service.get_schedule_by_id(schedule_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo lớp
@schedule_bp.route("/by-class/<int:class_id>", methods=["GET"])
@jwt_required()
def get_class_schedules(class_id):
    result = schedule_service.get_schedules_by_class(class_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo giáo viên
@schedule_bp.route("/by-teacher/<teacher_id>", methods=["GET"])
@jwt_required()
def get_teacher_schedules(teacher_id):
    result = schedule_service.get_schedules_by_teacher(teacher_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo phòng
@schedule_bp.route("/by-room/<int:room_id>", methods=["GET"])
@jwt_required()
def get_room_schedules(room_id):
    result = schedule_service.get_schedules_by_room(room_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo ngày
@schedule_bp.route("/by-date/<date>", methods=["GET"])
@jwt_required()
def get_schedules_by_date(date):
    result = schedule_service.get_schedules_by_date(date)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Tạo lịch học mới
@schedule_bp.route("", methods=["POST"])
def create_schedule():
    data = request.get_json()
    if not data:
        return error_response("No data provided", 400)

    result = schedule_service.create_schedule(data)
    if result["success"]:
        return success_response(result["data"], 201)
    return error_response(result["error"], 400)


# Cập nhật lịch học
@schedule_bp.route("/<int:schedule_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_schedule(schedule_id):
    data = request.get_json()
    if not data:
        return error_response("No data provided", 400)

    result = schedule_service.update_schedule(schedule_id, data)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 400)


# Xóa lịch học
@schedule_bp.route("/<int:schedule_id>", methods=["DELETE"])
@jwt_required()
def delete_schedule(schedule_id):
    result = schedule_service.delete_schedule(schedule_id)
    if result["success"]:
        return success_response({"message": result["message"]})
    return error_response(result["error"], 404)


# Tìm phòng trống
@schedule_bp.route("/available-rooms", methods=["GET"])
@jwt_required()
def find_available_rooms():
    date = request.args.get("date")
    start_time = request.args.get("start_time")
    end_time = request.args.get("end_time")
    min_capacity = request.args.get("min_capacity", type=int)

    if not date or not start_time or not end_time:
        return error_response(
            "Missing required parameters: date, start_time, end_time", 400
        )

    result = schedule_service.find_available_rooms(
        date, start_time, end_time, min_capacity
    )
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 400)


# Tạo lịch học lặp lại
@schedule_bp.route("/recurring", methods=["POST"])
@jwt_required()
def create_recurring_schedule():
    data = request.get_json()
    if (
        not data
        or "base_data" not in data
        or "recurrence_type" not in data
        or "end_date" not in data
    ):
        return error_response("Missing required parameters", 400)

    weekdays = data.get("weekdays")

    result = schedule_service.create_recurring_schedule(
        data["base_data"], data["recurrence_type"], data["end_date"], weekdays
    )

    if result["success"]:
        return success_response(result["data"], 201)
    return error_response(result["error"], 400)


# Kiểm tra tình trạng sẵn sàng của giáo viên
@schedule_bp.route("/teacher-availability/<teacher_id>", methods=["GET"])
@jwt_required()
def get_teacher_availability(teacher_id):
    date = request.args.get("date")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if date:
        result = schedule_service.get_teacher_availability(teacher_id, date_str=date)
    elif start_date and end_date:
        result = schedule_service.get_teacher_availability(
            teacher_id, start_date_str=start_date, end_date_str=end_date
        )
    else:
        result = schedule_service.get_teacher_availability(teacher_id)

    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 400)


# Lấy lịch học của lớp (dạng list hoặc calendar)
@schedule_bp.route("/class-schedule/<int:class_id>", methods=["GET"])
@jwt_required()
def get_class_schedule(class_id):
    format_type = request.args.get("format", "list")

    if format_type not in ["list", "calendar"]:
        return error_response("Format type must be 'list' or 'calendar'", 400)

    result = schedule_service.get_class_schedule(class_id, format_type)

    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)
