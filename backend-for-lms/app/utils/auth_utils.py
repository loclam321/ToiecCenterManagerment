from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.utils.response_utils import error_response
import json


def _extract_role_from_identity(identity):
    # identity may be dict, JSON string, or simple string id
    if isinstance(identity, dict):
        return identity.get("role")
    if isinstance(identity, str):
        try:
            parsed = json.loads(identity)
            if isinstance(parsed, dict):
                return parsed.get("role")
        except Exception:
            # not a JSON string, fallthrough
            return None
    return None


def admin_required(fn):
    """Decorator kiểm tra user có phải admin hay không"""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        # prefer role from JWT claims if present
        claims = get_jwt() or {}
        role = claims.get("role")
        if role is None:
            # fallback: try identity payload
            identity = get_jwt_identity()
            role = _extract_role_from_identity(identity)
        if role != "admin":
            return error_response(message="Admin access required", status_code=403)
        return fn(*args, **kwargs)

    return wrapper


def teacher_required(fn):
    """Decorator kiểm tra user có phải giáo viên hay không"""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt() or {}
        role = claims.get("role")
        if role is None:
            identity = get_jwt_identity()
            role = _extract_role_from_identity(identity)
        if role not in ("teacher", "admin"):
            return error_response(message="Teacher access required", status_code=403)
        return fn(*args, **kwargs)

    return wrapper
