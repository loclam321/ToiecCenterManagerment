from functools import wraps
from operator import ge
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.response_utils import error_response

def admin_required(fn):
    """Decorator kiểm tra user có phải admin hay không"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(get_jwt_identity())
        current_user = get_jwt_identity()
        if current_user.get("role") != "admin":
            return error_response(message="Admin access required", status_code=403)
        return fn(*args, **kwargs)
    return wrapper

def teacher_required(fn):
    """Decorator kiểm tra user có phải giáo viên hay không"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user.get("role") != "teacher" and current_user.get("role") != "admin":
            return error_response(message="Teacher access required", status_code=403)
        return fn(*args, **kwargs)
    return wrapper