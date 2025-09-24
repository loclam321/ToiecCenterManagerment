from flask import Blueprint, request, jsonify
from app.services.teacher_service import TeacherService
from app.utils.response_helper import success_response, error_response
from app.utils.validators import Validator

teacher_bp = Blueprint("teacher", __name__, url_prefix="/api/teachers")
teacher_service = TeacherService()


@teacher_bp.route("/", methods=["GET"])
def get_all_teachers():
    """Lấy danh sách tất cả giáo viên"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        search = request.args.get("search", "", type=str)
        
        if search:
            teachers = teacher_service.search(search)
            data = [teacher.to_dict() for teacher in teachers]
            total = len(data)
        else:
            offset = (page - 1) * per_page
            result = teacher_service.get_paginated(offset, per_page)
            data = result["data"]
            total = result["total"]
        
        return success_response({
            "teachers": data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        return error_response(f"Lỗi khi lấy danh sách giáo viên: {str(e)}", 500)


@teacher_bp.route("/<user_id>", methods=["GET"])
def get_teacher_by_id(user_id):
    """Lấy thông tin giáo viên theo ID"""
    try:
        teacher = teacher_service.get_by_id(user_id)
        if not teacher:
            return error_response("Không tìm thấy giáo viên", 404)
        
        return success_response({"teacher": teacher.to_dict()})
    except Exception as e:
        return error_response(f"Lỗi khi lấy thông tin giáo viên: {str(e)}", 500)


@teacher_bp.route("/senior", methods=["GET"])
def get_senior_teachers():
    """Lấy danh sách giáo viên thâm niên (> 5 năm)"""
    try:
        teachers = teacher_service.get_senior_teachers()
        data = [teacher.to_dict() for teacher in teachers]
        
        return success_response({"senior_teachers": data})
    except Exception as e:
        return error_response(f"Lỗi khi lấy danh sách giáo viên thâm niên: {str(e)}", 500)


@teacher_bp.route("/statistics", methods=["GET"])
def get_teacher_statistics():
    """Lấy thống kê giáo viên"""
    try:
        stats = teacher_service.get_statistics()
        return success_response({"statistics": stats})
    except Exception as e:
        return error_response(f"Lỗi khi lấy thống kê: {str(e)}", 500)


@teacher_bp.route("/", methods=["POST"])
def create_teacher():
    """Tạo giáo viên mới"""
    try:
        data = request.get_json()
        
        # Validation
        validation_result = Validator.validate_teacher_data(data)
        if not validation_result["valid"]:
            return error_response("Dữ liệu không hợp lệ", 400, None, validation_result["errors"])
        
        teacher = teacher_service.create(data)
        if not teacher:
            return error_response("Không thể tạo giáo viên mới", 400)
        
        return success_response({"teacher": teacher.to_dict()}, 201)
    except Exception as e:
        return error_response(f"Lỗi khi tạo giáo viên: {str(e)}", 500)


@teacher_bp.route("/<user_id>", methods=["PUT"])
def update_teacher(user_id):
    """Cập nhật thông tin giáo viên"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
        
        # Validation for update (less strict than create)
        if "user_email" in data and data["user_email"]:
            email_validation = Validator.validate_email(data["user_email"])
            if not email_validation["valid"]:
                return error_response("Email không hợp lệ", 400)
        
        if "user_telephone" in data and data["user_telephone"]:
            if not Validator.validate_phone(data["user_telephone"]):
                return error_response("Số điện thoại không hợp lệ", 400)
        
        teacher = teacher_service.update(user_id, data)
        if not teacher:
            return error_response("Không tìm thấy giáo viên hoặc không thể cập nhật", 404)
        
        return success_response({"teacher": teacher.to_dict()})
    except Exception as e:
        return error_response(f"Lỗi khi cập nhật giáo viên: {str(e)}", 500)


@teacher_bp.route("/<user_id>", methods=["DELETE"])
def delete_teacher(user_id):
    """Xóa giáo viên"""
    try:
        success = teacher_service.delete(user_id)
        if not success:
            return error_response("Không tìm thấy giáo viên hoặc không thể xóa", 404)
        
        return success_response({"message": "Xóa giáo viên thành công"})
    except Exception as e:
        return error_response(f"Lỗi khi xóa giáo viên: {str(e)}", 500)


@teacher_bp.route("/init-test-data", methods=["POST"])
def init_test_data():
    """Khởi tạo dữ liệu test cho giáo viên"""
    try:
        teachers = teacher_service.create_test_teachers()
        data = [teacher.to_dict() for teacher in teachers]
        
        return success_response({
            "message": f"Đã tạo {len(teachers)} giáo viên test",
            "teachers": data
        }, 201)
    except Exception as e:
        return error_response(f"Lỗi khi tạo dữ liệu test: {str(e)}", 500)
