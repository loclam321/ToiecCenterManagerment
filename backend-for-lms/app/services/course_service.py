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
            query = Course.query.filter_by(is_deleted=0)

            # Xử lý các filter nếu có
            if filters:
                # Filter theo level
                if filters.get("level"):
                    query = query.filter(Course.level == filters["level"])

                # Filter theo mode
                if filters.get("mode"):
                    query = query.filter(Course.mode == filters["mode"])

                # Filter theo status
                if filters.get("status"):
                    query = query.filter(Course.status == filters["status"])

                # Filter theo teacher
                if filters.get("teacher_id"):
                    query = query.filter(Course.teacher_id == filters["teacher_id"])

                # Filter theo tên (tìm kiếm)
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(Course.course_name.like(search_term))

                # Xử lý sắp xếp
                sort_by = filters.get("sort_by", "created_at")
                sort_order = filters.get("sort_order", "desc")

                # Đảm bảo sort_by là tên cột hợp lệ trong Course model
                valid_sort_columns = [
                    "course_id",
                    "course_code",
                    "course_name",
                    "level",
                    "mode",
                    "start_date",
                    "end_date",
                    "tuition_fee",
                    "capacity",
                    "status",
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
                    query = query.order_by(Course.created_at.desc())
            else:
                # Sắp xếp mặc định
                query = query.order_by(Course.created_at.desc())

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
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}
        return {"success": True, "data": course.to_dict()}

    def create_course(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
            course = Course(
                course_id=self._generate_course_id(),
                course_code=payload.get("course_code"),
                course_name=payload["course_name"],
                course_description=payload.get("course_description"),
                target_score=payload.get("target_score"),
                level=payload.get("level"),
                mode=payload.get("mode", "OFFLINE"),
                schedule_text=payload.get("schedule_text"),
                start_date=self._parse_date(payload.get("start_date")),
                end_date=self._parse_date(payload.get("end_date")),
                session_count=payload.get("session_count"),
                total_hours=payload.get("total_hours"),
                tuition_fee=payload.get("tuition_fee"),
                capacity=payload.get("capacity"),
                status=payload.get("status", "OPEN"),
                is_deleted=0,
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
        except KeyError as exc:
            self.db.session.rollback()
            return {"success": False, "error": f"Missing field: {exc.args[0]}"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error creating course")
            return {"success": False, "error": str(exc)}

    def update_course(self, course_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            for field in [
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
            ]:
                if field in payload:
                    setattr(course, field, payload[field])

            if "start_date" in payload:
                course.start_date = self._parse_date(payload["start_date"])
            if "end_date" in payload:
                course.end_date = self._parse_date(payload["end_date"])

            course.updated_at = datetime.utcnow()
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
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            if soft_delete:
                course.is_deleted = 1
                course.updated_at = datetime.utcnow()
            else:
                self.db.session.delete(course)
            self.db.session.commit()
            return {"success": True}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error deleting course")
            return {"success": False, "error": str(exc)}

    @staticmethod
    def _parse_date(value: Optional[str]) -> Optional[date]:
        if not value:
            return None
        if isinstance(value, date):
            return value
        return datetime.strptime(value, "%Y-%m-%d").date()
