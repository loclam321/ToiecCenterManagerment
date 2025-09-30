from flask import Blueprint, request, jsonify
from app.services.class_service import ClassService
from app.utils.response_helper import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt_identity

class_bp = Blueprint("classes", __name__, url_prefix="/api/classes")
class_service = ClassService()

@class_bp.route("", methods=["GET"])
@jwt_required()
def get_classes():
    """Lấy danh sách lớp học với phân trang và lọc"""
    try:
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=10, type=int)
        
        # Xử lý các filter từ query params
        filters = {}
        
        if request.args.get("course_id"):
            filters["course_id"] = request.args.get("course_id")
            
        if request.args.get("status"):
            filters["status"] = request.args.get("status")
            
        if request.args.get("active_only") == "true":
            filters["active_only"] = True
            
        if request.args.get("available_only") == "true":
            filters["available_only"] = True
            
        if request.args.get("ongoing") == "true":
            filters["ongoing"] = True
            
        if request.args.get("search"):
            filters["search"] = request.args.get("search")
            
        if request.args.get("sort_by"):
            filters["sort_by"] = request.args.get("sort_by")
            
        if request.args.get("sort_dir"):
            filters["sort_dir"] = request.args.get("sort_dir")
        
        result = class_service.get_all_classes(page, per_page, filters)
        
        if result["success"]:
            return success_response(
                data=result["data"],
                meta=result.get("pagination"),
                status_code=200
            )
        return error_response(message=result["error"], status_code=400)
    
    except Exception as e:
        return error_response(message=f"Error retrieving classes: {str(e)}", status_code=500)

@class_bp.route("/<int:class_id>", methods=["GET"])
@jwt_required()
def get_class(class_id):
    """Lấy thông tin lớp học theo ID"""
    try:
        result = class_service.get_class_by_id(class_id)
        
        if result["success"]:
            return success_response(data=result["data"], status_code=200)
        return error_response(message=result["error"], status_code=404)
    
    except Exception as e:
        return error_response(message=f"Error retrieving class: {str(e)}", status_code=500)

@class_bp.route("", methods=["POST"])
def create_class():
    """Tạo mới lớp học"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response(message="No data provided", status_code=400)
        
        if "course_id" not in data:
            return error_response(message="course_id is required", status_code=400)
        
        result = class_service.create_class(data)
        
        if result["success"]:
            return success_response(data=result["data"], status_code=201)
        return error_response(message=result["error"], status_code=400)
    
    except Exception as e:
        return error_response(message=f"Error creating class: {str(e)}", status_code=500)

@class_bp.route("/<int:class_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_class(class_id):
    """Cập nhật thông tin lớp học"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response(message="No data provided", status_code=400)
        
        result = class_service.update_class(class_id, data)
        
        if result["success"]:
            return success_response(data=result["data"], status_code=200)
        return error_response(message=result["error"], status_code=400)
    
    except Exception as e:
        return error_response(message=f"Error updating class: {str(e)}", status_code=500)

@class_bp.route("/<int:class_id>", methods=["DELETE"])
@jwt_required()
def delete_class(class_id):
    """Xóa lớp học"""
    try:
        # Xác định xem có phải soft delete hay không
        soft_delete = request.args.get("soft", "true").lower() != "false"
        
        result = class_service.delete_class(class_id, soft_delete)
        
        if result["success"]:
            return success_response(message=result["message"], status_code=200)
        return error_response(message=result["error"], status_code=404)
    
    except Exception as e:
        return error_response(message=f"Error deleting class: {str(e)}", status_code=500)

@class_bp.route("/<int:class_id>/enroll", methods=["POST"])
@jwt_required()
def enroll_student(class_id):
    """Ghi danh sinh viên vào lớp học"""
    try:
        data = request.get_json()
        
        if not data or "student_id" not in data:
            return error_response(message="student_id is required", status_code=400)
        
        result = class_service.enroll_student(class_id, data["student_id"])
        
        if result["success"]:
            return success_response(message=result["message"], status_code=200)
        return error_response(message=result["error"], status_code=400)
    
    except Exception as e:
        return error_response(message=f"Error enrolling student: {str(e)}", status_code=500)

@class_bp.route("/<int:class_id>/unenroll", methods=["POST"])
@jwt_required()
def unenroll_student(class_id):
    """Hủy ghi danh sinh viên khỏi lớp học"""
    try:
        data = request.get_json()
        
        if not data or "student_id" not in data:
            return error_response(message="student_id is required", status_code=400)
        
        result = class_service.unenroll_student(class_id, data["student_id"])
        
        if result["success"]:
            return success_response(message=result["message"], status_code=200)
        return error_response(message=result["error"], status_code=400)
    
    except Exception as e:
        return error_response(message=f"Error unenrolling student: {str(e)}", status_code=500)

@class_bp.route("/<int:class_id>/metrics", methods=["GET"])
@jwt_required()
def get_class_metrics(class_id):
    """Lấy các chỉ số thống kê của lớp học"""
    try:
        result = class_service.get_class_metrics(class_id)
        
        if result["success"]:
            return success_response(data=result["data"], status_code=200)
        return error_response(message=result["error"], status_code=404)
    
    except Exception as e:
        return error_response(message=f"Error retrieving class metrics: {str(e)}", status_code=500)

# Route bổ sung: Lấy lớp học theo khóa học
@class_bp.route("/by-course/<course_id>", methods=["GET"])
@jwt_required()
def get_classes_by_course(course_id):
    """Lấy danh sách lớp học theo khóa học"""
    try:
        result = class_service.get_classes_by_course(course_id)
        
        if result["success"]:
            return success_response(data=result["data"], status_code=200)
        return error_response(message=result["error"], status_code=404)
    
    except Exception as e:
        return error_response(message=f"Error retrieving classes: {str(e)}", status_code=500)