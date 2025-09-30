from app.config import db
from app.models.course_model import Course
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime


class CourseService:
    """Service xử lý business logic cho Course, chỉ trả về dữ liệu thuần"""

    def __init__(self, database=None):
        self.db = database or db

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
                course_id=data["course_id"],
                course_name=data["course_name"],
                course_description=data.get("course_description"),
                status=data.get("status") or ("OPEN" if data.get("course_status", "ACTIVE") == "ACTIVE" else "CLOSED"),
            )
            self.db.session.add(course)
            self.db.session.commit()
            return course
        except IntegrityError:
            self.db.session.rollback()
            print("IntegrityError: Duplicate course_id")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo course: {str(e)}")
            return None

    def update(self, course_id: str, data: Dict[str, Any]) -> Optional[Course]:
        """Cập nhật course, trả về Course cập nhật hoặc None"""
        try:
            course = self.get_by_id(course_id)
            if not course:
                return None

            for key, value in data.items():
                if hasattr(course, key) and key != "course_id":
                    setattr(course, key, value)

            self.db.session.commit()
            return course
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật course: {str(e)}")
            return None

    def delete(self, course_id: str) -> bool:
        """Xóa course, trả về True/False"""
        try:
            course = self.get_by_id(course_id)
            if not course:
                return False

            if not self._can_delete_course(course):
                return False

            self.db.session.delete(course)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
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
            print(f"Lỗi khi toggle status: {str(e)}")
            return None

    def create_test_course(self) -> Optional[Course]:
        """Tạo course test nếu chưa có, trả về Course"""
        try:
            existing = self.db.session.query(Course).filter_by(course_id="TEST001").first()
            if existing:
                return existing
            course = Course(
                course_id="TEST001",
                course_name="Test Course",
                course_description="This is a test course",
                course_status="ACTIVE",
            )
            self.db.session.add(course)
            self.db.session.commit()
            return course
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo test course: {str(e)}")
            return None

    # --------- Helpers ----------
    def _generate_course_id(self) -> str:
        """Sinh course_id định dạng CS000001, CS000002,..."""
        try:
            last = self.db.session.query(Course).order_by(Course.course_id.desc()).first()
            if not last:
                return "CS000001"
            if last.course_id.startswith("CS") and len(last.course_id) == 8:
                try:
                    num = int(last.course_id[2:])
                    return f"CS{num + 1:06d}"
                except ValueError:
                    pass
            total = self.db.session.query(Course).count()
            return f"CS{total + 1:06d}"
        except Exception as e:
            print(f"Lỗi khi generate course_id: {str(e)}")
            return f"CS{datetime.now().strftime('%H%M%S')}"

    def _can_delete_course(self, course: Course) -> bool:
        """Business rule trước khi xóa (tạm thời luôn True)"""
        # TODO: kiểm tra enrollments liên quan
        return True