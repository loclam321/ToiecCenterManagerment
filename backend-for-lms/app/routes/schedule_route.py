from flask import Blueprint, request
from app.services.schedule_service import ScheduleService
from app.utils.response_helper import success_response, error_response
from flask_jwt_extended import jwt_required

schedule_bp = Blueprint("schedules", __name__, url_prefix="/api/schedules")
schedule_service = ScheduleService()


# Lấy lịch học theo ID
@schedule_bp.route("/<int:schedule_id>", methods=["GET"])
def get_schedule(schedule_id):
    result = schedule_service.get_schedule_by_id(schedule_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo lớp
@schedule_bp.route("/by-class/<int:class_id>", methods=["GET"])
def get_class_schedules(class_id):
    result = schedule_service.get_schedules_by_class(class_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo giáo viên
@schedule_bp.route("/by-teacher/<teacher_id>", methods=["GET"])
def get_teacher_schedules(teacher_id):
    result = schedule_service.get_schedules_by_teacher(teacher_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo phòng
@schedule_bp.route("/by-room/<int:room_id>", methods=["GET"])
def get_room_schedules(room_id):
    result = schedule_service.get_schedules_by_room(room_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


# Lấy lịch học theo ngày
@schedule_bp.route("/by-date/<date>", methods=["GET"])
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

    # Kiểm tra trường bắt buộc class_id
    if not data.get("class_id"):
        return error_response("class_id is required", 400)

    # Lấy thông tin về lớp học từ class_id
    from app.models.class_model import Class

    class_obj = Class.query.get(data.get("class_id"))

    if not class_obj:
        return error_response(f"Class with ID {data.get('class_id')} not found", 404)

    # Lấy ngày bắt đầu và kết thúc từ class
    start_date = class_obj.class_startdate
    end_date = class_obj.class_enddate

    if not start_date or not end_date:
        return error_response("Class does not have valid start_date or end_date", 400)

    # Lấy các ngày trong tuần từ request (0: Chủ nhật, 1: Thứ 2, ..., 6: Thứ 7)
    weekdays = data.get("weekdays")
    if not weekdays or not isinstance(weekdays, list):
        return error_response(
            "weekdays must be a non-empty list of integers (0-6)", 400
        )

    # Validate weekdays
    if not all(isinstance(day, int) and 0 <= day <= 6 for day in weekdays):
        return error_response("weekdays must contain integers between 0 and 6", 400)

    # Xóa weekdays khỏi dữ liệu gốc để tránh xung đột
    schedule_data = {k: v for k, v in data.items() if k != "weekdays"}

    # Tạo lịch học cho tất cả các ngày phù hợp
    created_schedules = []
    errors = []

    # Import thư viện để xử lý ngày
    from datetime import datetime, timedelta

    # Tạo lịch cho mỗi ngày phù hợp trong khoảng thời gian
    current_date = start_date
    while current_date <= end_date:
        # Kiểm tra ngày trong tuần (weekday() trả về 0 cho thứ hai, 6 cho chủ nhật)
        # Chuyển đổi sang định dạng 0 cho chủ nhật, 1 cho thứ 2, ..., 6 cho thứ 7
        current_weekday = current_date.weekday()
        # Chuyển từ 0-6 (Mon-Sun) sang 1-7 (Mon-Sun)
        current_weekday = (current_weekday + 1) % 7

        # Nếu ngày này thuộc danh sách các ngày đã chọn
        if current_weekday in weekdays:
            # Tạo dữ liệu cho lịch học này
            schedule_data_copy = schedule_data.copy()
            schedule_data_copy["schedule_date"] = current_date.strftime("%Y-%m-%d")

            # Gọi service để tạo lịch học
            result = schedule_service.create_schedule(schedule_data_copy)

            if result["success"]:
                created_schedules.append(result["data"])
            else:
                errors.append(
                    {
                        "date": current_date.strftime("%Y-%m-%d"),
                        "error": result["error"],
                    }
                )

        # Chuyển sang ngày tiếp theo
        current_date += timedelta(days=1)

    # Trả về kết quả
    if created_schedules:
        return success_response(
            {
                "created_schedules": created_schedules,
                "errors": errors if errors else None,
                "total_created": len(created_schedules),
                "total_errors": len(errors),
            },
            201,
        )
    else:
        return error_response(
            "No schedules were created. Check errors for details", 400, errors
        )


# Cập nhật lịch học
@schedule_bp.route("/<int:schedule_id>", methods=["PUT", "PATCH"])
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
def delete_schedule(schedule_id):
    result = schedule_service.delete_schedule(schedule_id)
    if result["success"]:
        return success_response({"message": result["message"]})
    return error_response(result["error"], 404)


# Tìm phòng trống
@schedule_bp.route("/available-rooms", methods=["GET"])
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
def get_class_schedule(class_id):
    format_type = request.args.get("format", "list")

    if format_type not in ["list", "calendar"]:
        return error_response("Format type must be 'list' or 'calendar'", 400)

    result = schedule_service.get_class_schedule(class_id, format_type)

    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)
