from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.lesson_service import LessonService
from app.utils.response_utils import (
    error_response,
    success_response,
    validation_error_response,
    not_found_response,
)

student_lesson_bp = Blueprint(
    "student_lesson", __name__, url_prefix="/api/student/lessons"
)
lesson_service = LessonService()


def _resolve_user_id(identity) -> str | None:
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get("user_id") or identity.get("sub")
    if isinstance(identity, str):
        return identity
    return None


@student_lesson_bp.route("", methods=["GET"])
@jwt_required()
def list_lessons():
    identity = get_jwt_identity()
    user_id = _resolve_user_id(identity)
    if not user_id:
        return error_response(message="Authentication required", status_code=401)

    class_id = request.args.get("class_id", type=int)
    result = lesson_service.get_lessons_for_student(user_id=user_id, class_id=class_id)
    if result.get("success"):
        return success_response(data=result.get("data", {}))
    return error_response(message=result.get("error", "Unable to fetch lessons"))


@student_lesson_bp.route("/<int:lesson_id>", methods=["GET"])
@jwt_required()
def lesson_detail(lesson_id: int):
    identity = get_jwt_identity()
    user_id = _resolve_user_id(identity)
    if not user_id:
        return error_response(message="Authentication required", status_code=401)

    result = lesson_service.get_lesson_detail(user_id=user_id, lesson_id=lesson_id)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    if status == 404:
        return not_found_response(message=result.get("error", "Lesson not found"))
    if status == 403:
        return error_response(message=result.get("error", "Lesson locked"), status_code=403)
    return error_response(message=result.get("error", "Unable to fetch lesson"), status_code=status)


@student_lesson_bp.route("/<int:lesson_id>/quiz", methods=["POST"])
@jwt_required()
def submit_lesson_quiz(lesson_id: int):
    identity = get_jwt_identity()
    user_id = _resolve_user_id(identity)
    if not user_id:
        return error_response(message="Authentication required", status_code=401)

    payload = request.get_json(silent=True) or {}
    responses = payload.get("responses")
    if responses is None or not isinstance(responses, list):
        return validation_error_response(message="responses must be a list of answers")

    result = lesson_service.submit_lesson_quiz(
        user_id=user_id, lesson_id=lesson_id, responses=responses
    )
    if result.get("success"):
        return success_response(data=result.get("data", {}), message="Quiz submitted")

    status = result.get("status", 400)
    if status == 404:
        return not_found_response(message=result.get("error", "Lesson not found"))
    if status == 403:
        return error_response(message=result.get("error", "Lesson locked"), status_code=403)
    return error_response(message=result.get("error", "Unable to submit quiz"), status_code=status)
