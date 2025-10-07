from typing import Dict, Any, Optional
from datetime import datetime
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.config import db
from app.models.course_model import Course


class CourseService:
    """Service xử lý business logic cho Course, chỉ trả về dữ liệu thuần"""

    def __init__(self, database=None):
        self.db = database or db

    def _generate_course_id(self) -> str:
        """Tạo course_id tự động theo format C0000001"""
        last_id = self.db.session.query(func.max(Course.course_id)).scalar()
        if not last_id:
            return "C0000001"
        return f"C{int(last_id[1:]) + 1:07d}"

    def get_all_courses(
        self, page: int = 1, per_page: int = 10, filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Lấy danh sách khóa học với phân trang, lọc và sắp xếp

        Args:
            page: Trang hiện tại
            per_page: Số lượng bản ghi trên mỗi trang
            filters: Dict chứa các tham số lọc và sắp xếp
        """
        try:
            query = Course.query

            # Xử lý các filter nếu có
            if filters:
                # Filter theo status
                if filters.get("course_status"):
                    query = query.filter(
                        Course.course_status == filters["course_status"]
                    )

                # Filter theo parent course
                if filters.get("cou_course_id"):
                    query = query.filter(
                        Course.cou_course_id == filters["cou_course_id"]
                    )

                # Filter theo tên (tìm kiếm)
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(
                        db.or_(
                            Course.course_name.like(search_term),
                            Course.course_code.like(search_term),
                            Course.course_description.like(search_term),
                        )
                    )

                # Xử lý sắp xếp
                sort_by = filters.get("sort_by", "course_id")
                sort_order = filters.get("sort_order", "desc")

                # Đảm bảo sort_by là tên cột hợp lệ trong Course model
                valid_sort_columns = [
                    "course_id",
                    "course_code",
                    "course_name",
                    "course_status",
                    "cou_course_id",
                ]

                if sort_by in valid_sort_columns:
                    column = getattr(Course, sort_by)
                    if sort_order.lower() == "desc":
                        query = query.order_by(column.desc())
                    else:
                        query = query.order_by(column.asc())
                else:
                    # Sắp xếp mặc định nếu sort_by không hợp lệ
                    query = query.order_by(Course.course_id.desc())
            else:
                # Sắp xếp mặc định
                query = query.order_by(Course.course_id.desc())

            # Phân trang
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)

            return {
                "success": True,
                "data": [course.to_dict() for course in pagination.items],
                "pagination": {
                    "total": pagination.total,
                    "pages": pagination.pages,
                    "page": page,
                    "per_page": per_page,
                    "has_next": pagination.has_next,
                    "has_prev": pagination.has_prev,
                },
            }
        except Exception as e:
            current_app.logger.error(f"Error in get_all_courses: {str(e)}")
            return {"success": False, "error": f"Error retrieving courses: {str(e)}"}

    def get_course_by_id(self, course_id: str) -> Dict[str, Any]:
        """Lấy thông tin chi tiết một khóa học"""
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}
        return {"success": True, "data": course.to_dict()}

    def get_child_courses(self, course_id: str) -> Dict[str, Any]:
        """Lấy danh sách các khóa học con của một khóa học"""
        try:
            parent_course = Course.query.get(course_id)
            if not parent_course:
                return {"success": False, "error": "Parent course not found"}

            child_courses = Course.query.filter_by(cou_course_id=course_id).all()
            return {
                "success": True,
                "data": [course.to_dict() for course in child_courses],
            }
        except Exception as e:
            current_app.logger.error(f"Error getting child courses: {str(e)}")
            return {"success": False, "error": str(e)}

    def create_course(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Tạo khóa học mới"""
        try:
            # Validate parent course nếu có
            if payload.get("cou_course_id"):
                parent_course = Course.query.get(payload["cou_course_id"])
                if not parent_course:
                    return {"success": False, "error": "Parent course not found"}

            course = Course(
                course_id=self._generate_course_id(),
                course_code=payload.get("course_code"),
                course_name=payload.get("course_name"),
                course_description=payload.get("course_description"),
                course_status=payload.get("course_status"),
                cou_course_id=payload.get("cou_course_id"),
            )

            self.db.session.add(course)
            self.db.session.commit()
            return {"success": True, "data": course.to_dict()}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error creating course: {exc}")
            return {"success": False, "error": "Duplicate course code or ID"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error creating course")
            return {"success": False, "error": str(exc)}

    def update_course(self, course_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Cập nhật thông tin khóa học"""
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            # Validate parent course nếu có thay đổi
            if "cou_course_id" in payload and payload["cou_course_id"]:
                # Không cho phép tự tham chiếu
                if payload["cou_course_id"] == course_id:
                    return {
                        "success": False,
                        "error": "Course cannot be its own parent",
                    }

                parent_course = Course.query.get(payload["cou_course_id"])
                if not parent_course:
                    return {"success": False, "error": "Parent course not found"}

            # Cập nhật các trường
            for field in [
                "course_code",
                "course_name",
                "course_description",
                "course_status",
                "cou_course_id",
            ]:
                if field in payload:
                    setattr(course, field, payload[field])

            self.db.session.commit()
            return {"success": True, "data": course.to_dict()}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error updating course: {exc}")
            return {"success": False, "error": "Duplicate course code"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error updating course")
            return {"success": False, "error": str(exc)}

    def delete_course(self, course_id: str) -> Dict[str, Any]:
        """Xóa khóa học"""
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            # Kiểm tra có khóa học con không
            child_courses = Course.query.filter_by(cou_course_id=course_id).count()
            if child_courses > 0:
                return {
                    "success": False,
                    "error": "Cannot delete course with child courses. Delete child courses first.",
                }

            self.db.session.delete(course)
            self.db.session.commit()
            return {"success": True, "message": "Course deleted successfully"}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error deleting course: {exc}")
            return {
                "success": False,
                "error": "Cannot delete course due to foreign key constraint",
            }
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error deleting course")
            return {"success": False, "error": str(exc)}

    def get_course_hierarchy(self, course_id: str) -> Dict[str, Any]:
        """Lấy cấu trúc phân cấp của khóa học (parent và children)"""
        try:
            course = Course.query.get(course_id)
            if not course:
                return {"success": False, "error": "Course not found"}

            result = course.to_dict()

            # Thêm thông tin parent course
            if course.parent_course:
                result["parent_course"] = course.parent_course.to_dict()

            # Thêm thông tin child courses
            result["child_courses"] = [
                child.to_dict() for child in course.child_courses
            ]

            return {"success": True, "data": result}

        except Exception as e:
            current_app.logger.error(f"Error getting course hierarchy: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_courses_summary(self) -> Dict[str, Any]:
        """Lấy tóm tắt thống kê các khóa học"""
        try:
            # Import ở đây để tránh circular import
            from app.models.learning_path_model import LearningPath
            
            # Query với tên bảng và cột chính xác
            query = self.db.session.query(
                Course.course_id,
                Course.course_name,
                Course.course_status,
                func.count(LearningPath.lp_id).label('learning_path_count')
            ).outerjoin(
                LearningPath, 
                LearningPath.course_id == Course.course_id
            ).group_by(
                Course.course_id, 
                Course.course_name, 
                Course.course_status
            ).order_by(Course.course_id)

            results = query.all()
            
            summary_data = []
            total_courses = 0
            active_courses = 0
            
            for result in results:
                total_courses += 1
                if result.course_status == 'active':
                    active_courses += 1
                    
                summary_data.append({
                    'course_id': result.course_id,
                    'course_name': result.course_name,
                    'course_status': result.course_status,
                    'learning_path_count': result.learning_path_count
                })
                
            return {
                "success": True,
                "data": {
                    "courses": summary_data,
                    "statistics": {
                        "total_courses": total_courses,
                        "active_courses": active_courses,
                        "inactive_courses": total_courses - active_courses
                    }
                }
            }
            
        except Exception as e:
            current_app.logger.error(f"Error in get_courses_summary: {str(e)}")
            return {"success": False, "error": str(e)}
