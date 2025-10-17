from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.services.test_service import TeacherTestService
from app.utils.response_utils import (
    error_response,
    not_found_response,
    success_response,
    validation_error_response,
)

teacher_test_bp = Blueprint("teacher_test", __name__, url_prefix="/api/teacher/tests")
service = TeacherTestService()


def _ensure_teacher_role():
    identity = get_jwt_identity()
    claims = get_jwt() or {}
    role = claims.get("role")
    if not identity or role not in {"teacher", "admin"}:
        return None
    return identity, role


@teacher_test_bp.route("/setup", methods=["GET"])
@jwt_required()
def teacher_test_setup():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    allow_all = role == "admin"
    result = service.get_teacher_test_setup(teacher_id, allow_all=allow_all)
    return success_response(data=result.get("data", {}))


@teacher_test_bp.route("/history/<int:class_id>", methods=["GET"])
@jwt_required()
def teacher_test_history(class_id: int):
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    allow_all = role == "admin"
    try:
        result = service.list_tests_for_class(teacher_id, class_id, allow_all=allow_all)
    except PermissionError as exc:
        return error_response(message=str(exc), status_code=403)

    if not result.get("success"):
        status = result.get("status", 400)
        if status == 404:
            return not_found_response(message=result.get("error", "Not found"))
        if status == 403:
            return error_response(message=result.get("error", "Permission denied"), status_code=403)
        return error_response(message=result.get("error", "Unable to fetch tests"), status_code=status)

    return success_response(data=result.get("data", {}))


@teacher_test_bp.route("", methods=["POST"])
@jwt_required()
def teacher_create_test():
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    payload = request.get_json(silent=True) or {}
    allow_all = role == "admin"
    result = service.create_test_for_teacher(teacher_id, payload, allow_all=allow_all)
    if result.get("success"):
        message = "Test created successfully" if role == "teacher" else "Test registered"
        return success_response(data=result.get("data", {}), message=message)

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to create test")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    if status == 400:
        return validation_error_response(message=error_message)
    return error_response(message=error_message, status_code=status)


@teacher_test_bp.route("/<int:test_id>", methods=["GET"])
@jwt_required()
def teacher_test_detail(test_id: int):
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    allow_all = role == "admin"
    result = service.get_test_detail(teacher_id, test_id, allow_all=allow_all)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to fetch test detail")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    return error_response(message=error_message, status_code=status)


@teacher_test_bp.route("/<int:test_id>", methods=["PUT"])
@jwt_required()
def teacher_update_test(test_id: int):
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    payload = request.get_json(silent=True) or {}
    allow_all = role == "admin"
    result = service.update_test_for_teacher(teacher_id, test_id, payload, allow_all=allow_all)
    if result.get("success"):
        return success_response(data=result.get("data", {}), message="Test updated successfully")

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to update test")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    if status == 400:
        return validation_error_response(message=error_message)
    return error_response(message=error_message, status_code=status)


@teacher_test_bp.route("/<int:test_id>", methods=["DELETE"])
@jwt_required()
def teacher_delete_test(test_id: int):
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    allow_all = role == "admin"
    result = service.delete_test_for_teacher(teacher_id, test_id, allow_all=allow_all)
    if result.get("success"):
        return success_response(data=result.get("data", {}), message="Test deleted successfully")

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to delete test")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    if status == 409:
        return error_response(message=error_message, status_code=409)
    return error_response(message=error_message, status_code=status)


@teacher_test_bp.route("/<int:test_id>/scoreboard", methods=["GET"])
@jwt_required()
def teacher_test_scoreboard(test_id: int):
    auth = _ensure_teacher_role()
    if auth is None:
        return error_response(message="Permission denied", status_code=403)

    teacher_id, role = auth
    allow_all = role == "admin"
    result = service.get_test_scoreboard(teacher_id, test_id, allow_all=allow_all)
    if result.get("success"):
        return success_response(data=result.get("data", {}))

    status = result.get("status", 400)
    error_message = result.get("error", "Unable to fetch scoreboard")
    if status == 404:
        return not_found_response(message=error_message)
    if status == 403:
        return error_response(message=error_message, status_code=403)
    return error_response(message=error_message, status_code=status)
