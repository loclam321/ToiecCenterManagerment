from flask import Blueprint, request, jsonify, render_template
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.consultregistraion_service import ConsultRegistrationService

consult_registration_bp = Blueprint(
    "consult_registration", __name__, url_prefix="/api/consult-registrations"
)

consult_service = ConsultRegistrationService()


# ========== PUBLIC ROUTES (No JWT required) ==========


@consult_registration_bp.route("/", methods=["POST"])
def send_consultation_verification_email():
    """
    Gửi email xác minh đăng ký tư vấn (CHƯA lưu vào database)

    Request Body:
    {
        "course_id": "C0000001",
        "cr_fullname": "Nguyen Van A",
        "cr_email": "user@example.com",  # Required
        "cr_phone": "0123456789",
        "cr_birthday": "2000-01-15",
        "cr_gender": "M"
    }

    Response:
    {
        "success": true,
        "message": "Verification email sent successfully. Please check your email...",
        "data": {...},
        "email_sent": true
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # ✅ Gọi method send_verification_email thay vì create
        result = consult_service.send_verification_email(data)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@consult_registration_bp.route("/verify-email/<token>", methods=["GET"])
def verify_consultation_email(token):
    """
    Xác thực email và TẠO record vào database

    URL: GET /api/consult-registrations/verify-email/<token>

    Success Response: Render HTML template
    Error Response: Render error template
    """
    try:
        result = consult_service.verify_email(token)

        if result["success"]:
            # ✅ Render template success
            return render_template(
                "verification_success.html",
                message=result["message"],
                data=result.get("data"),
            )
        else:
            # ❌ Render template error
            return (
                render_template("verification_error.html", error=result["error"]),
                400,
            )

    except Exception as e:
        return render_template("verification_error.html", error=str(e)), 500


# ========== PROTECTED ROUTES (JWT required) ==========


@consult_registration_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_consultation_registrations():
    """
    Lấy danh sách tất cả đăng ký tư vấn (có phân trang và filter)

    Query Parameters:
    - page: Trang hiện tại (default: 1)
    - per_page: Số lượng trên 1 trang (default: 10)
    - course_id: Lọc theo khóa học
    - email: Tìm theo email
    - phone: Tìm theo số điện thoại
    - gender: Lọc theo giới tính (M/F)
    - search: Tìm kiếm theo tên, email, phone
    - sort_by: Sắp xếp theo field (cr_id, cr_fullname, created_at, ...)
    - sort_order: Thứ tự sắp xếp (asc/desc)
    - include_course: Có bao gồm thông tin khóa học (true/false)
    """
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)

        # Build filters
        filters = {
            "course_id": request.args.get("course_id"),
            "email": request.args.get("email"),
            "phone": request.args.get("phone"),
            "gender": request.args.get("gender"),
            "search": request.args.get("search"),
            "sort_by": request.args.get("sort_by", "created_at"),
            "sort_order": request.args.get("sort_order", "desc"),
            "include_course": request.args.get("include_course", "false").lower()
            == "true",
        }

        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}

        result = consult_service.get_all_registrations(page, per_page, filters)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@consult_registration_bp.route("/<int:cr_id>", methods=["GET"])
@jwt_required()
def get_consultation_registration(cr_id):
    """
    Lấy thông tin chi tiết đăng ký tư vấn theo ID

    Query Parameters:
    - include_course: Có bao gồm thông tin khóa học (true/false)
    """
    try:
        include_course = request.args.get("include_course", "false").lower() == "true"
        result = consult_service.get_registration_by_id(cr_id, include_course)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@consult_registration_bp.route("/<int:cr_id>", methods=["PUT"])
@jwt_required()
def update_consultation_registration(cr_id):
    """
    Cập nhật thông tin đăng ký tư vấn

    Request Body (tất cả fields đều optional):
    {
        "cr_fullname": "Nguyen Van B",
        "cr_birthday": "2000-02-20",
        "cr_phone": "0987654321",
        "cr_email": "newmail@example.com",
        "cr_gender": "F"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        result = consult_service.update_registration(cr_id, data)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@consult_registration_bp.route("/<int:cr_id>", methods=["DELETE"])
@jwt_required()
def delete_consultation_registration(cr_id):
    """
    Xóa đăng ký tư vấn
    """
    try:
        result = consult_service.delete_registration(cr_id)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@consult_registration_bp.route("/by-course/<course_id>", methods=["GET"])
@jwt_required()
def get_registrations_by_course(course_id):
    """
    Lấy danh sách đăng ký tư vấn theo khóa học

    URL: GET /api/consult-registrations/by-course/<course_id>
    """
    try:
        result = consult_service.get_registrations_by_course(course_id)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@consult_registration_bp.route("/statistics", methods=["GET"])
@jwt_required()
def get_consultation_statistics():
    """
    Lấy thống kê đăng ký tư vấn

    Response:
    {
        "success": true,
        "data": {
            "total_registrations": 150,
            "by_course": [
                {"course_name": "TOEIC Basic", "count": 50},
                {"course_name": "TOEIC Advanced", "count": 100}
            ],
            "by_gender": {
                "M": 80,
                "F": 70
            }
        }
    }
    """
    try:
        result = consult_service.get_statistics()

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
