from flask import Blueprint
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.services.class_service import ClassService
from app.utils.response_utils import (
    error_response,
    not_found_response,
    success_response,
)

teacher_class_bp = Blueprint(
    "teacher_class", __name__, url_prefix="/api/teacher/classes"
)
class_service = ClassService()


def _ensure_teacher_role():
    identity = get_jwt_identity()
    claims = get_jwt() or {}
    role = claims.get("role")
    if not identity or role not in {"teacher", "admin"}:
        return None
    return identity, role


@teacher_class_bp.route("", methods=["GET"])
@jwt_required()
def teacher_classes_overview():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, _ = auth
    result = class_service.get_classes_for_teacher(teacher_id)
    if result.get("success"):
        return success_response(data=result.get("data", []))

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to load teacher classes")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    return error_response(message=error_message, status_code=status)
