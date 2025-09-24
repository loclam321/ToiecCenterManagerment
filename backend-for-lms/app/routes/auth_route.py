from flask import Blueprint, request, render_template
from app.services.auth_service import AuthService
from app.services.register_service import RegisterService
from app.models.student_model import Student
from app.config import db
from app.utils.response_utils import (
    success_response,
    error_response,
    validation_error_response,
    created_response,
    not_found_response,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
auth_service = AuthService()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return validation_error_response("Email and password are required")

    result = auth_service.login(email, password)
    if result["success"]:
        return success_response(data=result, message="Login successful")
    else:
        return error_response(
            message=result.get("error", "Invalid credentials"), status_code=401
        )


@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    data = request.get_json()
    result = auth_service.register_student(data)

    if result["success"]:
        return created_response(data=result, message="Student registered successfully")
    else:
        return validation_error_response(
            message="Registration failed",
            errors=result.get(
                "errors", {"general": result.get("error", "Unknown error")}
            ),
        )


@auth_bp.route("/register/teacher", methods=["POST"])
def register_teacher():
    data = request.get_json()
    result = auth_service.register_teacher(data)

    if result["success"]:
        return created_response(data=result, message="Teacher registered successfully")
    else:
        return validation_error_response(
            message="Registration failed",
            errors=result.get(
                "errors", {"general": result.get("error", "Unknown error")}
            ),
        )


@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    data = request.get_json()
    token = data.get("token")

    if not token:
        return validation_error_response(message="Token is required")

    result = auth_service.refresh_token(token)
    if result["success"]:
        return success_response(data=result, message="Token refreshed successfully")
    else:
        return error_response(
            message=result.get("error", "Invalid token"), status_code=401
        )


@auth_bp.route("/change-password", methods=["POST"])
def change_password():
    data = request.get_json()
    user_id = data.get("user_id")
    role = data.get("role")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not all([user_id, role, old_password, new_password]):
        return validation_error_response(message="All fields are required")

    result = auth_service.change_password(user_id, role, old_password, new_password)
    if result["success"]:
        return success_response(message="Password changed successfully")
    else:
        return error_response(message=result.get("error", "Password change failed"))


@auth_bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    """Xác minh email khi người dùng click vào link trong email"""
    register_service = RegisterService()
    result = register_service.verify_email(token)

    # Đây là route hiển thị HTML, giữ nguyên
    if result["success"]:
        return render_template("verification_success.html", message=result["message"])
    else:
        return render_template("verification_error.html", message=result["message"])


# Thêm route để gửi lại email xác nhận
@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return validation_error_response("Email is required")

    # Tìm tài khoản
    student = db.session.query(Student).filter_by(user_email=email).first()

    if student and not student.is_email_verified:
        # Gửi lại email xác nhận
        try:
            from flask import current_app
            from app.utils.email_utils import send_verification_email

            send_verification_email(
                current_app.extensions["mail"], student.user_email, student.user_id
            )
            return success_response(
                message="Verification email sent. Please check your inbox."
            )
        except Exception as e:
            return error_response(message="Failed to send verification email")

    # Trả về thông báo chung để tránh leak thông tin
    return success_response(
        message="If your email exists in our system, a verification email has been sent."
    )
