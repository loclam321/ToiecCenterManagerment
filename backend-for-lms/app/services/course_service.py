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

    def get_all_courses(self, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        pagination = Course.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
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

    def get_course_by_id(self, course_id: str) -> Dict[str, Any]:
        course = Course.query.get(course_id)
        if not course:
            return {"success": False, "error": "Course not found"}
        return {"success": True, "data": course.to_dict()}

    def create_course(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
    # --------- READ ----------
    def get_all(self, status: Optional[str] = None) -> List[Course]:
        """Lấy tất cả courses, có thể lọc theo status"""
        try:
            query = self.db.session.query(Course)
            if status:
                # accept both new 'status' and legacy values
                query = query.filter(Course.status == status)
            return query.all()
        except Exception as e:
            print(f"Lỗi khi lấy danh sách courses: {str(e)}")
            return []

    def get_by_id(self, course_id: str) -> Optional[Course]:
        """Lấy course theo ID"""
        try:
            return self.db.session.query(Course).filter(Course.course_id == course_id).first()
        except Exception as e:
            print(f"Lỗi khi lấy course theo ID: {str(e)}")
            return None

    def get_by_status(self, status: str) -> List[Course]:
        """Lấy danh sách courses theo status"""
        try:
            return self.db.session.query(Course).filter(Course.status == status).all()
        except Exception as e:
            print(f"Lỗi khi lấy courses theo status: {str(e)}")
            return []

    def search(self, keyword: str) -> List[Course]:
        """Tìm kiếm courses theo keyword"""
        try:
            if not keyword or len(keyword.strip()) < 2:
                return []
            keyword = keyword.strip()
            return (
                self.db.session.query(Course)
                .filter(
                    Course.course_name.like(f"%{keyword}%")
                    | Course.course_description.like(f"%{keyword}%")
                )
                .all()
            )
        except Exception as e:
            print(f"Lỗi khi tìm kiếm courses: {str(e)}")
            return []

    def get_paginated(self, offset: int = 0, limit: int = 10, status: Optional[str] = None) -> Dict[str, Any]:
        """
        Lấy danh sách courses phân trang + tổng số dòng.
        Trả về dict: {"data": [to_dict...], "total": int}
        """
        try:
            query = self.db.session.query(Course)
            if status:
                query = query.filter(Course.status == status)
            total = query.count()
            items = query.offset(offset).limit(limit).all()
            data = [c.to_dict() for c in items if hasattr(c, "to_dict")]
            return {"data": data, "total": total}
        except Exception as e:
            print(f"Lỗi khi phân trang courses: {str(e)}")
            return {"data": [], "total": 0}

    def get_statistics(self) -> Dict[str, int]:
        """Thống kê số lượng theo status"""
        try:
            total = self.db.session.query(Course).count()
            # Map legacy ACTIVE/INACTIVE/DRAFT to new statuses: treat OPEN as ACTIVE, CLOSED as INACTIVE
            active = self.db.session.query(Course).filter(Course.status.in_(["OPEN", "RUNNING"])) .count()
            inactive = self.db.session.query(Course).filter(Course.status.in_(["CLOSED", "ARCHIVED"])) .count()
            draft = self.db.session.query(Course).filter_by(status="DRAFT").count()
            return {
                "total_courses": total,
                "active_courses": active,
                "inactive_courses": inactive,
                "draft_courses": draft,
            }
        except Exception as e:
            print(f"Lỗi khi thống kê courses: {str(e)}")
            return {"total_courses": 0, "active_courses": 0, "inactive_courses": 0, "draft_courses": 0}

    # --------- WRITE ----------
    def create(self, data: Dict[str, Any]) -> Optional[Course]:
        """Tạo course mới, trả về Course hoặc None"""
        try:
            # Tự tạo ID nếu không có
            if not data.get("course_id"):
                data["course_id"] = self._generate_course_id()

            # Kiểm tra trùng khóa
            exists = (
                self.db.session.query(Course)
                .filter(Course.course_id == data["course_id"])
                .first()
            )
            if exists:
                print("Course ID already exists")
                return None

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
                course_id=data["course_id"],
                course_name=data["course_name"],
                course_description=data.get("course_description"),
                status=data.get("status") or ("OPEN" if data.get("course_status", "ACTIVE") == "ACTIVE" else "CLOSED"),
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
            print(f"Lỗi khi xóa course: {str(e)}")
            return False

    def toggle_status(self, course_id: str) -> Optional[Course]:
        """Toggle status between OPEN <-> CLOSED (back-compat with ACTIVE/INACTIVE)."""
        try:
            course = self.get_by_id(course_id)
            if not course:
                return None

            status = (course.status or "OPEN").upper()
            if status in ("OPEN", "RUNNING"):
                course.status = "CLOSED"
            else:
                course.status = "OPEN"

            self.db.session.commit()
            return course
        except Exception as e:
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
