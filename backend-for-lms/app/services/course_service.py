from typing import Dict, Any, Optional
from datetime import datetime, date
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
                if filters.get("status"):
                    query = query.filter(Course.status == filters["status"])

                # Filter theo level
                if filters.get("level"):
                    query = query.filter(Course.level == filters["level"])

                # Filter theo mode
                if filters.get("mode"):
                    query = query.filter(Course.mode == filters["mode"])

                # Filter theo teacher_id
                if filters.get("teacher_id"):
                    query = query.filter(Course.teacher_id == filters["teacher_id"])

                # Filter theo campus_id
                if filters.get("campus_id"):
                    query = query.filter(Course.campus_id == filters["campus_id"])

                # Filter theo soft delete
                if filters.get("include_deleted") != True:
                    query = query.filter(Course.is_deleted == 0)

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
                    "status",
                    "level",
                    "mode",
                    "start_date",
                    "end_date",
                    "created_at",
                    "updated_at",
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
                # Sắp xếp mặc định và không hiển thị deleted
                query = query.filter(Course.is_deleted == 0).order_by(
                    Course.course_id.desc()
                )

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

    def get_course_by_id(
        self, course_id: str, include_deleted: bool = False
    ) -> Dict[str, Any]:
        """Lấy thông tin chi tiết một khóa học"""
        query = Course.query.filter_by(course_id=course_id)
        if not include_deleted:
            query = query.filter(Course.is_deleted == 0)

        course = query.first()
        if not course:
            return {"success": False, "error": "Course not found"}
        return {"success": True, "data": course.to_dict()}

    def create_course(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Tạo khóa học mới"""
        try:
            # Validate dữ liệu đầu vào
            if not payload.get("course_name"):
                return {"success": False, "error": "Course name is required"}

            # Xử lý date fields
            start_date = None
            end_date = None
            if payload.get("start_date"):
                if isinstance(payload["start_date"], str):
                    start_date = datetime.fromisoformat(payload["start_date"]).date()
                elif isinstance(payload["start_date"], date):
                    start_date = payload["start_date"]

            if payload.get("end_date"):
                if isinstance(payload["end_date"], str):
                    end_date = datetime.fromisoformat(payload["end_date"]).date()
                elif isinstance(payload["end_date"], date):
                    end_date = payload["end_date"]

            course = Course(
                course_id=self._generate_course_id(),
                course_code=payload.get("course_code"),
                course_name=payload.get("course_name"),
                course_description=payload.get("course_description"),
                target_score=payload.get("target_score"),
                level=payload.get("level"),
                mode=payload.get("mode", "OFFLINE"),
                schedule_text=payload.get("schedule_text"),
                start_date=start_date,
                end_date=end_date,
                session_count=payload.get("session_count"),
                total_hours=payload.get("total_hours"),
                tuition_fee=payload.get("tuition_fee"),
                capacity=payload.get("capacity"),
                status=payload.get("status", "DRAFT"),
                teacher_id=payload.get("teacher_id"),
                learning_path_id=payload.get("learning_path_id"),
                campus_id=payload.get("campus_id"),
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
        course = Course.query.filter_by(course_id=course_id, is_deleted=0).first()
        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            # Cập nhật các trường cơ bản
            basic_fields = [
                "course_code",
                "course_name", 
                "course_description",
                "target_score",
                "level",
                "mode",
                "schedule_text",
                "session_count",
                "total_hours",
                "tuition_fee",
                "capacity",
                "status",
                "teacher_id",
                "learning_path_id",
                "campus_id",
            ]

            for field in basic_fields:
                if field in payload:
                    setattr(course, field, payload[field])

            # Xử lý date fields đặc biệt
            if "start_date" in payload:
                if payload["start_date"]:
                    if isinstance(payload["start_date"], str):
                        course.start_date = datetime.fromisoformat(
                            payload["start_date"]
                        ).date()
                    else:
                        course.start_date = payload["start_date"]
                else:
                    course.start_date = None

            if "end_date" in payload:
                if payload["end_date"]:
                    if isinstance(payload["end_date"], str):
                        course.end_date = datetime.fromisoformat(
                            payload["end_date"]
                        ).date()
                    else:
                        course.end_date = payload["end_date"]
                else:
                    course.end_date = None

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

    def delete_course(self, course_id: str, soft_delete: bool = True) -> Dict[str, Any]:
        """Xóa khóa học (soft delete hoặc hard delete)"""
        course = Course.query.filter_by(course_id=course_id, is_deleted=0).first()
        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            if soft_delete:
                # Soft delete - chỉ đánh dấu is_deleted = 1
                course.is_deleted = 1
                self.db.session.commit()
                return {"success": True, "message": "Course soft deleted successfully"}
            else:
                # Hard delete - xóa hoàn toàn
                self.db.session.delete(course)
                self.db.session.commit()
                return {"success": True, "message": "Course permanently deleted"}

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

    def restore_course(self, course_id: str) -> Dict[str, Any]:
        """Khôi phục khóa học đã bị soft delete"""
        course = Course.query.filter_by(course_id=course_id, is_deleted=1).first()
        if not course:
            return {"success": False, "error": "Deleted course not found"}

        try:
            course.is_deleted = 0
            self.db.session.commit()
            return {"success": True, "data": course.to_dict()}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error restoring course")
            return {"success": False, "error": str(exc)}

    def get_courses_summary(self) -> Dict[str, Any]:
        """Lấy tóm tắt thống kê các khóa học"""
        try:
            # Import ở đây để tránh circular import
            from app.models.learning_path_model import LearningPath

            # Query với tên bảng và cột chính xác (chỉ course không bị xóa)
            query = (
                self.db.session.query(
                    Course.course_id,
                    Course.course_name,
                    Course.status,  # Sử dụng 'status' thay vì 'course_status'
                    func.count(LearningPath.lp_id).label("learning_path_count"),
                )
                .filter(Course.is_deleted == 0)  # Chỉ lấy course chưa bị xóa
                .outerjoin(LearningPath, LearningPath.course_id == Course.course_id)
                .group_by(Course.course_id, Course.course_name, Course.status)
                .order_by(Course.course_id)
            )

            results = query.all()

            summary_data = []
            total_courses = 0
            status_counts = {
                "DRAFT": 0,
                "OPEN": 0,
                "RUNNING": 0,
                "CLOSED": 0,
                "ARCHIVED": 0,
            }

            for result in results:
                total_courses += 1
                if result.status in status_counts:
                    status_counts[result.status] += 1

                summary_data.append(
                    {
                        "course_id": result.course_id,
                        "course_name": result.course_name,
                        "status": result.status,
                        "learning_path_count": result.learning_path_count,
                    }
                )

            return {
                "success": True,
                "data": {
                    "courses": summary_data,
                    "statistics": {
                        "total_courses": total_courses,
                        "status_breakdown": status_counts,
                        "active_courses": status_counts["OPEN"]
                        + status_counts["RUNNING"],
                        "inactive_courses": status_counts["DRAFT"]
                        + status_counts["CLOSED"]
                        + status_counts["ARCHIVED"],
                    },
                },
            }

        except Exception as e:
            current_app.logger.error(f"Error in get_courses_summary: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_courses_by_teacher(self, teacher_id: str) -> Dict[str, Any]:
        """Lấy danh sách khóa học theo teacher_id"""
        try:
            courses = Course.query.filter_by(teacher_id=teacher_id, is_deleted=0).all()

            return {"success": True, "data": [course.to_dict() for course in courses]}
        except Exception as e:
            current_app.logger.error(f"Error getting courses by teacher: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_courses_by_status(self, status: str) -> Dict[str, Any]:
        """Lấy danh sách khóa học theo status"""
        try:
            valid_statuses = ["DRAFT", "OPEN", "RUNNING", "CLOSED", "ARCHIVED"]
            if status not in valid_statuses:
                return {"success": False, "error": "Invalid status"}

            courses = Course.query.filter_by(status=status, is_deleted=0).all()

            return {"success": True, "data": [course.to_dict() for course in courses]}
        except Exception as e:
            current_app.logger.error(f"Error getting courses by status: {str(e)}")
            return {"success": False, "error": str(e)}
