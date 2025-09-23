from flask import Blueprint, jsonify, request
from app.config import db
from app.services.course_service import CourseService
from app.utils.response_utils import (
    success_response,
    error_response,
    validation_error_response,
    created_response,
    not_found_response,
)

course_bp = Blueprint("courses", __name__, url_prefix="/api/courses")

# Khởi tạo service
course_service = CourseService()


@course_bp.route("/", methods=["GET"])
def get_courses():
    """Lấy danh sách courses (tùy chọn lọc theo status: ACTIVE/INACTIVE/DRAFT)"""
    try:
        status = request.args.get("status")
        courses = course_service.get_all(status=status)
        return success_response(
            data=[c.to_dict() for c in courses],
            message="Courses retrieved successfully",
        )
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return error_response(message="Internal server error")


@course_bp.route("/", methods=["POST"])
def create_course():
    """Tạo course mới"""
    data = request.get_json()

    if not data:
        return validation_error_response("No data provided")

    result = course_service.create(data)

    if result["success"]:
        return created_response(data=result["data"], message=result["message"])
    else:
        status_code = result.get("status_code", 500)
        if "validation_errors" in result:
            return validation_error_response(
                message=result["error"], errors=result["validation_errors"]
            )
        else:
            return error_response(message=result["error"], status_code=status_code)


@course_bp.route("/<course_id>", methods=["GET"])
def get_course(course_id):
    """Lấy course theo ID"""
    result = course_service.get_by_id(course_id)

    if result["success"]:
        return success_response(
            data=result["data"], message="Course retrieved successfully"
        )
    else:
        status_code = result.get("status_code", 500)
        if status_code == 404:
            return not_found_response(
                message="Course not found",
                resource_type="Course",
                resource_id=course_id,
            )
        else:
            return error_response(message=result["error"], status_code=status_code)


@course_bp.route("/<course_id>", methods=["PUT"])
def update_course(course_id):
    """Cập nhật course"""
    data = request.get_json()

    if not data:
        return validation_error_response("No data provided")

    result = course_service.update(course_id, data)

    if result["success"]:
        return success_response(data=result["data"], message=result["message"])
    else:
        status_code = result.get("status_code", 500)
        if "validation_errors" in result:
            return validation_error_response(
                message=result["error"], errors=result["validation_errors"]
            )
        elif status_code == 404:
            return not_found_response(
                message="Course not found",
                resource_type="Course",
                resource_id=course_id,
            )
        else:
            return error_response(message=result["error"], status_code=status_code)


@course_bp.route("/<course_id>", methods=["DELETE"])
def delete_course(course_id):
    """Xóa course"""
    result = course_service.delete(course_id)

    if result["success"]:
        return success_response(message=result["message"])
    else:
        status_code = result.get("status_code", 500)
        if status_code == 404:
            return not_found_response(
                message="Course not found",
                resource_type="Course",
                resource_id=course_id,
            )
        else:
            return error_response(message=result["error"], status_code=status_code)


@course_bp.route("/search", methods=["GET"])
def search_courses():
    """Tìm kiếm courses"""
    keyword = request.args.get("q", "")
    result = course_service.search(keyword)

    if result["success"]:
        return success_response(
            data=result["data"],
            message=f"Found {result['count']} courses",
            meta={"count": result["count"], "keyword": result.get("keyword")},
        )
    else:
        return error_response(
            message=result["error"], status_code=result.get("status_code", 500)
        )


@course_bp.route("/<course_id>/toggle-status", methods=["PATCH"])
def toggle_course_status(course_id):
    """Toggle status của course"""
    result = course_service.toggle_status(course_id)

    if result["success"]:
        return success_response(data=result["data"], message=result["message"])
    else:
        status_code = result.get("status_code", 500)
        if status_code == 404:
            return not_found_response(
                message="Course not found",
                resource_type="Course",
                resource_id=course_id,
            )
        else:
            return error_response(message=result["error"], status_code=status_code)


@course_bp.route("/statistics", methods=["GET"])
def get_course_statistics():
    """Lấy thống kê courses"""
    result = course_service.get_statistics()

    if result["success"]:
        return success_response(
            data=result["data"], message="Course statistics retrieved successfully"
        )
    else:
        return error_response(
            message=result["error"], status_code=result.get("status_code", 500)
        )


@course_bp.route("/test", methods=["GET"])
def test_course_db():
    """Test database connection với Course"""
    result = course_service.create_test_course()
    return (
        success_response(data=result)
        if result["success"]
        else error_response(message=result["error"])
    )
