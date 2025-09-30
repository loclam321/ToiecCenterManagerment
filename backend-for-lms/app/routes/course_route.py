from flask import Blueprint, request
from app.services.course_service import CourseService
from app.utils.response_helper import (
    success_response,
    error_response,
    validation_error_response,
)

course_bp = Blueprint("courses", __name__, url_prefix="/api/courses")
course_service = CourseService()


@course_bp.route("", methods=["GET"])
def get_courses():
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    result = course_service.get_all_courses(page=page, per_page=per_page)
    if result["success"]:
        payload = {
            "courses": result["data"],
            "pagination": result["pagination"],
        }
        return success_response(payload)
    return error_response(result["error"], 404)


@course_bp.route("/<course_id>", methods=["GET"])
def get_course(course_id):
    result = course_service.get_course_by_id(course_id)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 404)


@course_bp.route("", methods=["POST"])
def create_course():
    payload = request.get_json(silent=True) or {}
    if "course_name" not in payload:
        return validation_error_response("course_name is required")

    result = course_service.create_course(payload)
    if result["success"]:
        return success_response(result["data"], status_code=201)
    return error_response(result["error"], 400)


@course_bp.route("/<course_id>", methods=["PUT", "PATCH"])
def update_course(course_id):
    payload = request.get_json(silent=True) or {}
    if not payload:
        return validation_error_response("No data provided")

    result = course_service.update_course(course_id, payload)
    if result["success"]:
        return success_response(result["data"])
    return error_response(result["error"], 400)


@course_bp.route("/<course_id>", methods=["DELETE"])
def delete_course(course_id):
    soft_delete = request.args.get("soft", default="true").lower() != "false"

    result = course_service.delete_course(course_id, soft_delete=soft_delete)
    if result["success"]:
        return success_response({"deleted": True})
    return error_response(result["error"], 400)
