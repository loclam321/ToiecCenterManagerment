from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_, and_

from app.config import db
from app.models.class_model import Class
from app.models.course_model import Course


class ClassService:
    """Service quản lý lớp học"""

    def __init__(self, database=None):
        self.db = database or db

    def get_all_classes(self, page: int = 1, per_page: int = 10, 
                      filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Lấy danh sách lớp học với phân trang và lọc
        
        Args:
            page: Trang hiện tại
            per_page: Số lượng record trên mỗi trang
            filters: Các tiêu chí lọc (course_id, status, active_only, etc.)
            
        Returns:
            Dict chứa danh sách lớp học và thông tin phân trang
        """
        try:
            query = Class.query

            # Áp dụng các bộ lọc
            if filters:
                if filters.get("course_id"):
                    query = query.filter(Class.course_id == filters["course_id"])
                    
                if filters.get("status"):
                    query = query.filter(Class.class_status == filters["status"])
                    
                if filters.get("active_only") is True:
                    query = query.filter(Class.class_status == "ACTIVE")
                    
                if filters.get("available_only") is True:
                    # Lớp còn slot và đang active
                    query = query.filter(
                        and_(
                            Class.class_status == "ACTIVE",
                            or_(
                                Class.class_maxstudents.is_(None),
                                Class.class_currentenrollment < Class.class_maxstudents
                            )
                        )
                    )
                    
                if filters.get("ongoing") is True:
                    today = date.today()
                    query = query.filter(
                        and_(
                            Class.class_startdate <= today,
                            Class.class_enddate >= today
                        )
                    )
                    
                # Search by name
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(Class.class_name.like(search_term))

            # Sắp xếp
            sort_by = filters.get("sort_by", "class_id") if filters else "class_id"
            sort_dir = filters.get("sort_dir", "asc") if filters else "asc"
            
            if sort_dir == "desc":
                query = query.order_by(getattr(Class, sort_by).desc())
            else:
                query = query.order_by(getattr(Class, sort_by))

            # Phân trang
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            classes = pagination.items

            return {
                "success": True,
                "data": [class_obj.to_dict() for class_obj in classes],
                "pagination": {
                    "total": pagination.total,
                    "pages": pagination.pages,
                    "page": page,
                    "per_page": per_page,
                    "has_next": pagination.has_next,
                    "has_prev": pagination.has_prev,
                }
            }
            
        except Exception as e:
            current_app.logger.error(f"Error in get_all_classes: {str(e)}")
            return {"success": False, "error": f"Error retrieving classes: {str(e)}"}

    def get_class_by_id(self, class_id: int) -> Dict[str, Any]:
        """
        Lấy thông tin lớp học theo ID
        
        Args:
            class_id: ID của lớp học
            
        Returns:
            Dict chứa thông tin lớp học hoặc thông báo lỗi
        """
        try:
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
                
            return {"success": True, "data": class_obj.to_dict()}
        except Exception as e:
            current_app.logger.error(f"Error in get_class_by_id: {str(e)}")
            return {"success": False, "error": f"Error retrieving class: {str(e)}"}

    def create_class(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo mới lớp học
        
        Args:
            data: Thông tin lớp học mới
            
        Returns:
            Dict chứa thông tin lớp học đã tạo hoặc thông báo lỗi
        """
        try:
            # Validate dữ liệu đầu vào
            if "course_id" not in data:
                return {"success": False, "error": "course_id is required"}
                
            # Kiểm tra course tồn tại
            course = Course.query.get(data["course_id"])
            if not course:
                return {"success": False, "error": f"Course with ID {data['course_id']} not found"}
            
            # Xử lý các trường ngày tháng
            start_date = None
            if "class_startdate" in data and data["class_startdate"]:
                if isinstance(data["class_startdate"], str):
                    start_date = datetime.strptime(data["class_startdate"], "%Y-%m-%d").date()
                else:
                    start_date = data["class_startdate"]
                
            end_date = None
            if "class_enddate" in data and data["class_enddate"]:
                if isinstance(data["class_enddate"], str):
                    end_date = datetime.strptime(data["class_enddate"], "%Y-%m-%d").date()
                else:
                    end_date = data["class_enddate"]
            
            # Tạo lớp học mới
            class_obj = Class(
                course_id=data["course_id"],
                class_name=data.get("class_name", course.course_name),
                class_startdate=start_date,
                class_enddate=end_date,
                class_maxstudents=data.get("class_maxstudents"),
                class_currentenrollment=data.get("class_currentenrollment", 0),
                class_status=data.get("class_status", "ACTIVE")
            )
            
            self.db.session.add(class_obj)
            self.db.session.commit()
            
            return {"success": True, "data": class_obj.to_dict()}
            
        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error in create_class: {str(e)}")
            return {"success": False, "error": f"Database integrity error: {str(e)}"}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in create_class: {str(e)}")
            return {"success": False, "error": f"Error creating class: {str(e)}"}

    def update_class(self, class_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cập nhật thông tin lớp học
        
        Args:
            class_id: ID của lớp học cần cập nhật
            data: Thông tin cập nhật
            
        Returns:
            Dict chứa thông tin lớp học đã cập nhật hoặc thông báo lỗi
        """
        try:
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
                
            # Cập nhật các trường dữ liệu
            if "class_name" in data:
                class_obj.class_name = data["class_name"]
                
            if "class_startdate" in data:
                if isinstance(data["class_startdate"], str):
                    class_obj.class_startdate = datetime.strptime(data["class_startdate"], "%Y-%m-%d").date()
                else:
                    class_obj.class_startdate = data["class_startdate"]
                
            if "class_enddate" in data:
                if isinstance(data["class_enddate"], str):
                    class_obj.class_enddate = datetime.strptime(data["class_enddate"], "%Y-%m-%d").date()
                else:
                    class_obj.class_enddate = data["class_enddate"]
                
            if "class_maxstudents" in data:
                class_obj.class_maxstudents = data["class_maxstudents"]
                
            if "class_currentenrollment" in data:
                class_obj.class_currentenrollment = data["class_currentenrollment"]
                
            if "class_status" in data:
                class_obj.class_status = data["class_status"]
                
            # Không cho phép thay đổi course_id sau khi đã tạo lớp
            
            self.db.session.commit()
            
            return {"success": True, "data": class_obj.to_dict()}
            
        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error in update_class: {str(e)}")
            return {"success": False, "error": f"Database integrity error: {str(e)}"}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in update_class: {str(e)}")
            return {"success": False, "error": f"Error updating class: {str(e)}"}

    def delete_class(self, class_id: int, soft_delete: bool = True) -> Dict[str, Any]:
        """
        Xóa lớp học
        
        Args:
            class_id: ID của lớp học cần xóa
            soft_delete: True để soft delete (chỉ đổi status), False để xóa hoàn toàn
            
        Returns:
            Dict kết quả thực hiện
        """
        try:
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
                
            if soft_delete:
                # Soft delete bằng cách đổi status
                class_obj.class_status = "DELETED"
                self.db.session.commit()
            else:
                # Hard delete
                self.db.session.delete(class_obj)
                self.db.session.commit()
                
            return {"success": True, "message": "Class deleted successfully"}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in delete_class: {str(e)}")
            return {"success": False, "error": f"Error deleting class: {str(e)}"}

    def enroll_student(self, class_id: int, student_id: str) -> Dict[str, Any]:
        """
        Ghi danh sinh viên vào lớp học
        
        Args:
            class_id: ID của lớp học
            student_id: ID của sinh viên
            
        Returns:
            Dict kết quả thực hiện
        """
        try:
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
                
            if not class_obj.is_active():
                return {"success": False, "error": "Cannot enroll in inactive class"}
                
            if class_obj.is_full():
                return {"success": False, "error": "Class is already full"}
            
            # TODO: Thêm enrollment record (cần model Student_Class)
            # enrollment = Student_Class(student_id=student_id, class_id=class_id)
            # self.db.session.add(enrollment)
            
            # Tăng số lượng học viên
            class_obj.class_currentenrollment += 1
            self.db.session.commit()
            
            return {"success": True, "message": "Student enrolled successfully"}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in enroll_student: {str(e)}")
            return {"success": False, "error": f"Error enrolling student: {str(e)}"}

    def unenroll_student(self, class_id: int, student_id: str) -> Dict[str, Any]:
        """
        Hủy ghi danh sinh viên khỏi lớp học
        
        Args:
            class_id: ID của lớp học
            student_id: ID của sinh viên
            
        Returns:
            Dict kết quả thực hiện
        """
        try:
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
            
            # TODO: Xóa enrollment record (cần model Student_Class)
            # enrollment = Student_Class.query.filter_by(student_id=student_id, class_id=class_id).first()
            # if not enrollment:
            #    return {"success": False, "error": "Student not enrolled in this class"}
            # self.db.session.delete(enrollment)
            
            # Giảm số lượng học viên
            if class_obj.class_currentenrollment > 0:
                class_obj.class_currentenrollment -= 1
            
            self.db.session.commit()
            
            return {"success": True, "message": "Student unenrolled successfully"}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in unenroll_student: {str(e)}")
            return {"success": False, "error": f"Error unenrolling student: {str(e)}"}

    def get_classes_by_course(self, course_id: str) -> Dict[str, Any]:
        """
        Lấy danh sách lớp học theo khóa học
        
        Args:
            course_id: ID của khóa học
            
        Returns:
            Dict chứa danh sách lớp học
        """
        try:
            classes = Class.query.filter_by(course_id=course_id).all()
            
            return {
                "success": True,
                "data": [class_obj.to_dict() for class_obj in classes]
            }
            
        except Exception as e:
            current_app.logger.error(f"Error in get_classes_by_course: {str(e)}")
            return {"success": False, "error": f"Error retrieving classes: {str(e)}"}

    def get_class_metrics(self, class_id: int) -> Dict[str, Any]:
        """
        Lấy các chỉ số thống kê của lớp học
        
        Args:
            class_id: ID của lớp học
            
        Returns:
            Dict chứa các chỉ số thống kê
        """
        try:
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
                
            # Tính toán các chỉ số
            enrollment_rate = 0
            if class_obj.class_maxstudents and class_obj.class_maxstudents > 0:
                enrollment_rate = (class_obj.class_currentenrollment / class_obj.class_maxstudents) * 100
                
            metrics = {
                "class_id": class_obj.class_id,
                "class_name": class_obj.class_name,
                "current_enrollment": class_obj.class_currentenrollment,
                "max_students": class_obj.class_maxstudents,
                "enrollment_rate": enrollment_rate,
                "is_full": class_obj.is_full(),
                "is_active": class_obj.is_active(),
                "is_ongoing": class_obj.is_ongoing()
            }
            
            return {"success": True, "data": metrics}
            
        except Exception as e:
            current_app.logger.error(f"Error in get_class_metrics: {str(e)}")
            return {"success": False, "error": f"Error retrieving class metrics: {str(e)}"}