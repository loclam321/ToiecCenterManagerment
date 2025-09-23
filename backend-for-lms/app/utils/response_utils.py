from flask import jsonify


def success_response(data=None, message="Success", meta=None, status_code=200):
    """Phản hồi thành công"""
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    if meta is not None:
        response["meta"] = meta
    return jsonify(response), status_code


def error_response(message="Error", status_code=500):
    """Phản hồi lỗi"""
    return jsonify({"success": False, "message": message}), status_code


def validation_error_response(message="Validation error", errors=None):
    """Phản hồi lỗi xác thực dữ liệu"""
    response = {"success": False, "message": message}
    if errors:
        response["errors"] = errors
    return jsonify(response), 400


def created_response(data=None, message="Resource created successfully"):
    """Phản hồi tạo mới thành công"""
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    return jsonify(response), 201


def not_found_response(
    message="Resource not found", resource_type=None, resource_id=None
):
    """Phản hồi không tìm thấy tài nguyên"""
    response = {"success": False, "message": message}
    if resource_type and resource_id:
        response["resource"] = {"type": resource_type, "id": resource_id}
    return jsonify(response), 404
