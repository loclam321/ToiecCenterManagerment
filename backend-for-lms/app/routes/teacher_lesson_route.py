from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.services.lesson_service import LessonService
from app.utils.response_utils import (
    error_response,
    not_found_response,
    success_response,
    validation_error_response,
)

teacher_lesson_bp = Blueprint(
    "teacher_lesson", __name__, url_prefix="/api/teacher/lessons"
)
lesson_service = LessonService()


def _ensure_teacher_role() -> tuple[str, str] | None:
    identity = get_jwt_identity()
    claims = get_jwt() or {}
    role = claims.get("role")
    if not identity or role not in {"teacher", "admin"}:
        return None
    return identity, role


@teacher_lesson_bp.route("/setup", methods=["GET"])
@jwt_required()
def teacher_lesson_setup():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, _ = auth
    result = lesson_service.get_teacher_creation_setup(teacher_id)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    if status == 404:
        return not_found_response(message=result.get("error", "Not found"))
    if status == 403:
        return error_response(message=result.get("error", "Permission denied"), status_code=403)
    return error_response(message=result.get("error", "Unable to load setup"), status_code=status)


@teacher_lesson_bp.route("", methods=["POST"])
@jwt_required()
def teacher_create_lesson():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    payload = request.get_json(silent=True) or {}

    result = lesson_service.create_lesson_for_teacher(teacher_id, payload)
    if result.get("success"):
        message = "Lesson created successfully" if role == "teacher" else "Lesson registered"
        return success_response(data=result.get("data", {}), message=message)

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to create lesson")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    if status == 400:
        return validation_error_response(message=error_message)
    return error_response(message=error_message, status_code=status)


@teacher_lesson_bp.route("/media", methods=["GET"])
@jwt_required()
def teacher_media_library():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    media_type = request.args.get("type", "image")
    result = lesson_service.get_media_library(media_type)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    if status == 404:
        return not_found_response(message=result.get("error", "Not found"))
    if status == 403:
        return error_response(message=result.get("error", "Permission denied"), status_code=403)
    if status == 400:
        return validation_error_response(message=result.get("error", "Bad request"))
    return error_response(message=result.get("error", "Unable to load media"), status_code=status)


@teacher_lesson_bp.route("/upload", methods=["POST"])
@jwt_required()
def teacher_upload_media():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    media_type = request.args.get("type", "")
    file_storage = request.files.get("file")

    result = lesson_service.upload_media_file(media_type, file_storage)
    if result.get("success"):
        return success_response(
            data=result.get("data", {}),
            message="File uploaded successfully",
        )

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to upload file")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    if status == 400:
        return validation_error_response(message=error_message)
    return error_response(message=error_message, status_code=status)


@teacher_lesson_bp.route("/history/<int:class_id>", methods=["GET"])
@jwt_required()
def teacher_lesson_history(class_id: int):
    """Lấy danh sách bài học theo class_id cho giáo viên."""
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, _ = auth
    result = lesson_service.get_teacher_lesson_history(teacher_id, class_id)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to fetch lesson history")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    return error_response(message=error_message, status_code=status)


@teacher_lesson_bp.route("/<int:lesson_id>", methods=["GET"])
@jwt_required()
def teacher_lesson_detail(lesson_id: int):
    """Lấy chi tiết bài học kèm items và choices cho giáo viên."""
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, _ = auth
    result = lesson_service.get_teacher_lesson_detail(teacher_id, lesson_id)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to fetch lesson detail")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    return error_response(message=error_message, status_code=status)


@teacher_lesson_bp.route("/<int:lesson_id>", methods=["PUT"])
@jwt_required()
def teacher_update_lesson(lesson_id: int):
    """Cập nhật bài học và items/choices cho giáo viên."""
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, _ = auth
    payload = request.get_json(silent=True) or {}

    result = lesson_service.update_lesson_for_teacher(teacher_id, lesson_id, payload)
    if result.get("success"):
        return success_response(
            data=result.get("data", {}),
            message="Lesson updated successfully"
        )

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to update lesson")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    if status == 400:
        return validation_error_response(message=error_message)
    return error_response(message=error_message, status_code=status)


@teacher_lesson_bp.route("/<int:lesson_id>", methods=["DELETE"])
@jwt_required()
def teacher_delete_lesson(lesson_id: int):
    """Xóa bài học và tất cả items/choices liên quan cho giáo viên."""
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, _ = auth
    result = lesson_service.delete_lesson_for_teacher(teacher_id, lesson_id)
    if result.get("success"):
        return success_response(
            data=result.get("data", {}),
            message="Lesson deleted successfully"
        )

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to delete lesson")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    return error_response(message=error_message, status_code=status)
