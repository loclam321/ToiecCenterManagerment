from flask import Blueprint, request, jsonify
from app.services.student_service import StudentService
from app.utils.response_utils import (
    success_response,
    error_response,
    not_found_response,
    created_response,
    validation_error_response
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import admin_required, teacher_required

student_bp = Blueprint("students", __name__, url_prefix="/api/students")
student_service = StudentService()

@student_bp.route("", methods=["GET"])
def get_students():
    """Lấy danh sách học viên với phân trang, tìm kiếm và lọc"""
    try:
        # Parse query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        search = request.args.get("search", None)
        
        # Handle search query if provided
        if search:
            result = student_service.search_students(search, page, per_page)
            if result["success"]:
                return success_response(data=result["data"])
            return error_response(message=result["error"])
            
        # Handle filters if provided
        filters = {}
        filter_fields = ["gender", "level", "verified", "enrolled_after", 
                         "enrolled_before", "sort_by", "sort_order"]
        
        for field in filter_fields:
            if field in request.args:
                # Convert verified to boolean if present
                if field == "verified" and request.args[field] in ["true", "false"]:
                    filters[field] = request.args[field].lower() == "true"
                else:
                    filters[field] = request.args[field]
        
        if filters:
            result = student_service.filter_students(filters, page, per_page)
            if result["success"]:
                return success_response(data=result["data"])
            return error_response(message=result["error"])
        
        # Default: get all students with pagination
        result = student_service.get_all_students(page, per_page)
        if result["success"]:
            return success_response(data=result["data"])
        return error_response(message=result["error"])
        
    except Exception as e:
        return error_response(message=f"Error retrieving students: {str(e)}")

@student_bp.route("/<student_id>", methods=["GET"])
@jwt_required()
def get_student(student_id):
    """Lấy thông tin một học viên theo ID"""
    try:
        result = student_service.get_student_by_id(student_id)
        if result["success"]:
            return success_response(data=result["data"])
        return not_found_response(message=result["error"])
    except Exception as e:
        return error_response(message=f"Error retrieving student: {str(e)}")

@student_bp.route("", methods=["POST"])
@jwt_required()
@admin_required  # Chỉ admin mới được tạo học viên qua API này
def create_student():
    """Tạo học viên mới"""
    try:
        data = request.get_json()
        if not data:
            return validation_error_response(message="No data provided")
        
        result = student_service.create_student(data)
        if result["success"]:
            return created_response(data=result["data"], message=result["message"])
        return validation_error_response(message=result["error"])
    except Exception as e:
        return error_response(message=f"Error creating student: {str(e)}")

@student_bp.route("/<student_id>", methods=["PUT", "PATCH"])
@jwt_required()
@admin_required  # Chỉ admin mới được cập nhật thông tin học viên
def update_student(student_id):
    """Cập nhật thông tin học viên"""
    try:
        data = request.get_json()
        if not data:
            return validation_error_response(message="No data provided")
        
        result = student_service.update_student(student_id, data)
        if result["success"]:
            return success_response(data=result["data"], message=result["message"])
        
        if "not found" in result["error"].lower():
            return not_found_response(message=result["error"])
        return validation_error_response(message=result["error"])
    except Exception as e:
        return error_response(message=f"Error updating student: {str(e)}")

@student_bp.route("/<student_id>", methods=["DELETE"])
@jwt_required()
@admin_required  # Chỉ admin mới được xóa học viên
def delete_student(student_id):
    """Xóa học viên"""
    try:
        result = student_service.delete_student(student_id)
        if result["success"]:
            return success_response(data=result["data"], message=result["message"])
        
        if "not found" in result["error"].lower():
            return not_found_response(message=result["error"])
        return error_response(message=result["error"])
    except Exception as e:
        return error_response(message=f"Error deleting student: {str(e)}")

@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_own_profile():
    """Học viên lấy thông tin cá nhân của mình"""
    try:
        current_user = get_jwt_identity()
        # Kiểm tra nếu người dùng hiện tại là học viên
        if current_user.get("role") != "student":
            return error_response(message="Access denied", status_code=403)
        
        student_id = current_user.get("user_id")
        result = student_service.get_student_by_id(student_id)
        
        if result["success"]:
            return success_response(data=result["data"])
        return not_found_response(message=result["error"])
    except Exception as e:
        return error_response(message=f"Error retrieving profile: {str(e)}")

@student_bp.route("/profile", methods=["PUT", "PATCH"])
@jwt_required()
def update_own_profile():
    """Học viên cập nhật thông tin cá nhân"""
    try:
        current_user = get_jwt_identity()
        # Kiểm tra nếu người dùng hiện tại là học viên
        if current_user.get("role") != "student":
            return error_response(message="Access denied", status_code=403)
        
        data = request.get_json()
        if not data:
            return validation_error_response(message="No data provided")
        
        # Giới hạn các trường được phép cập nhật
        allowed_fields = ["user_name", "user_telephone", "user_gender", "user_birthday"]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        student_id = current_user.get("user_id")
        result = student_service.update_student(student_id, update_data)
        
        if result["success"]:
            return success_response(data=result["data"], message=result["message"])
        return validation_error_response(message=result["error"])
    except Exception as e:
        return error_response(message=f"Error updating profile: {str(e)}")

@student_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_student_stats():
    """Lấy thống kê về học viên (dành cho admin)"""
    # Phần này có thể mở rộng sau với các chức năng thống kê
    # như số lượng học viên theo cấp độ, theo giới tính, tỉ lệ verify email...
    return success_response(message="Student statistics feature coming soon")