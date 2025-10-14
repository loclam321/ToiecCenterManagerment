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

                # ❌ REMOVED: mode không còn tồn tại trong model mới
                # if filters.get("mode"):
                #     query = query.filter(Course.mode == filters["mode"])

                # ❌ REMOVED: user_id không còn tồn tại, có thể dùng teacher_id
                # if filters.get("user_id"):
                #     query = query.filter(Course.user_id == filters["user_id"])

                # ✅ THÊM: Filter theo teacher_id (nếu cần)
                # if filters.get("teacher_id"):
                #     query = query.filter(Course.teacher_id == filters["teacher_id"])

                # ✅ THÊM: Filter theo learning_path_id (nếu cần)
                # if filters.get("learning_path_id"):
                #     query = query.filter(Course.learning_path_id == filters["learning_path_id"])

                # ✅ THÊM: Filter theo prerequisite course
                if filters.get("cou_course_id"):
                    query = query.filter(
                        Course.cou_course_id == filters["cou_course_id"]
                    )

                # ❌ REMOVED: is_deleted không còn tồn tại (đã bỏ soft delete)
                # Filter theo soft delete

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
                    "start_date",
                    "end_date",
                    "created_at",
                    "updated_at",
                    "tuition_fee",  # ✅ Thêm
                    "capacity",  # ✅ Thêm
                    "target_score",  # ✅ Thêm
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

            # Phân trang
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)

            # ✅ SỬA: Thêm tham số include_prerequisite nếu cần
            include_prerequisite = (
                filters.get("include_prerequisite", False) if filters else False
            )

            return {
                "success": True,
                "data": [
                    course.to_dict(include_prerequisite=include_prerequisite)
                    for course in pagination.items
                ],
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
        self, course_id: str, include_prerequisite: bool = False
    ) -> Dict[str, Any]:
        """
        Lấy thông tin chi tiết một khóa học

        Args:
            course_id: ID của khóa học
            include_prerequisite: Có bao gồm thông tin khóa học tiên quyết không
        """
        # ❌ REMOVED: is_deleted không còn tồn tại
        course = Course.query.filter_by(course_id=course_id).first()

        if not course:
            return {"success": False, "error": "Course not found"}

        return {
            "success": True,
            "data": course.to_dict(include_prerequisite=include_prerequisite),
        }

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

            # ✅ SỬA: Cập nhật theo model mới (loại bỏ mode, is_deleted, campus_id, user_id)
            course = Course(
                course_id=self._generate_course_id(),
                course_code=payload.get("course_code"),
                course_name=payload.get("course_name"),
                course_description=payload.get("course_description"),
                target_score=payload.get("target_score"),
                level=payload.get("level"),
                # ❌ REMOVED: mode
                schedule_text=payload.get("schedule_text"),
                start_date=start_date,
                end_date=end_date,
                session_count=payload.get("session_count"),
                total_hours=payload.get("total_hours"),
                tuition_fee=payload.get("tuition_fee"),
                capacity=payload.get("capacity"),
                status=payload.get("status", "DRAFT"),
                # ✅ THÊM: cou_course_id (prerequisite course)
                cou_course_id=payload.get("cou_course_id"),
                # ❌ REMOVED: teacher_id, learning_path_id, campus_id đã bị xóa khỏi model
            )

            self.db.session.add(course)
            self.db.session.commit()
            return {"success": True, "data": course.to_dict()}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error creating course: {exc}")

            # Kiểm tra lỗi cụ thể
            error_msg = str(exc.orig)
            if "Duplicate entry" in error_msg:
                if "course_code" in error_msg:
                    return {"success": False, "error": "Course code already exists"}
                return {"success": False, "error": "Duplicate course ID"}
            elif "foreign key constraint" in error_msg.lower():
                return {"success": False, "error": "Invalid prerequisite course ID"}

            return {"success": False, "error": "Database integrity error"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error creating course")
            return {"success": False, "error": str(exc)}

    def update_course(self, course_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Cập nhật thông tin khóa học"""
        # ❌ REMOVED: is_deleted filter
        course = Course.query.filter_by(course_id=course_id).first()

        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            # ✅ SỬA: Cập nhật danh sách các trường theo model mới
            basic_fields = [
                "course_code",
                "course_name",
                "course_description",
                "target_score",
                "level",
                # ❌ REMOVED: mode
                "schedule_text",
                "session_count",
                "total_hours",
                "tuition_fee",
                "capacity",
                "status",
                # ✅ THÊM: cou_course_id
                "cou_course_id",
                # ❌ REMOVED: teacher_id, learning_path_id, campus_id
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

            error_msg = str(exc.orig)
            if "Duplicate entry" in error_msg:
                return {"success": False, "error": "Course code already exists"}
            elif "foreign key constraint" in error_msg.lower():
                return {"success": False, "error": "Invalid prerequisite course ID"}

            return {"success": False, "error": "Database integrity error"}
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error updating course")
            return {"success": False, "error": str(exc)}

    def delete_course(self, course_id: str) -> Dict[str, Any]:
        """
        Xóa khóa học (Hard delete)

        Note: Model mới không còn soft delete (is_deleted)
        """
        course = Course.query.filter_by(course_id=course_id).first()

        if not course:
            return {"success": False, "error": "Course not found"}

        try:
            # ✅ SỬA: Chỉ hard delete vì không còn soft delete
            self.db.session.delete(course)
            self.db.session.commit()
            return {"success": True, "message": "Course deleted successfully"}

        except IntegrityError as exc:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error deleting course: {exc}")
            return {
                "success": False,
                "error": "Cannot delete course. It may be referenced by other records (classes, learning paths, etc.)",
            }
        except Exception as exc:
            self.db.session.rollback()
            current_app.logger.exception("Unexpected error deleting course")
            return {"success": False, "error": str(exc)}

    # ❌ REMOVED: restore_course() vì không còn soft delete
    # def restore_course(self, course_id: str) -> Dict[str, Any]:
    #     """Khôi phục khóa học đã bị soft delete"""
    #     ...

    def get_courses_summary(self) -> Dict[str, Any]:
        """Lấy tóm tắt thống kê các khóa học"""
        try:
            # Import ở đây để tránh circular import
            from app.models.learning_path_model import LearningPath

            # ✅ SỬA: Loại bỏ filter is_deleted
            query = (
                self.db.session.query(
                    Course.course_id,
                    Course.course_name,
                    Course.status,
                    Course.level,  # ✅ Thêm level
                    Course.tuition_fee,  # ✅ Thêm tuition_fee
                    Course.capacity,  # ✅ Thêm capacity
                    func.count(LearningPath.lp_id).label("learning_path_count"),
                )
                # ❌ REMOVED: .filter(Course.is_deleted == 0)
                .outerjoin(LearningPath, LearningPath.course_id == Course.course_id)
                .group_by(
                    Course.course_id,
                    Course.course_name,
                    Course.status,
                    Course.level,
                    Course.tuition_fee,
                    Course.capacity,
                )
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
            level_counts = {"BEGINNER": 0, "INTERMEDIATE": 0, "ADVANCED": 0}

            for result in results:
                total_courses += 1
                if result.status in status_counts:
                    status_counts[result.status] += 1
                if result.level in level_counts:
                    level_counts[result.level] += 1

                summary_data.append(
                    {
                        "course_id": result.course_id,
                        "course_name": result.course_name,
                        "status": result.status,
                        "level": result.level,
                        "tuition_fee": (
                            float(result.tuition_fee) if result.tuition_fee else None
                        ),
                        "capacity": int(result.capacity) if result.capacity else None,
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
                        "level_breakdown": level_counts,  # ✅ Thêm
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

    # ❌ REMOVED: get_courses_by_teacher() vì teacher_id không còn trong model
    # def get_courses_by_teacher(self, teacher_id: str) -> Dict[str, Any]:
    #     """Lấy danh sách khóa học theo teacher_id"""
    #     ...

    def get_courses_by_status(self, status: str) -> Dict[str, Any]:
        """Lấy danh sách khóa học theo status"""
        try:
            valid_statuses = ["DRAFT", "OPEN", "RUNNING", "CLOSED", "ARCHIVED"]
            if status not in valid_statuses:
                return {"success": False, "error": "Invalid status"}

            # ❌ REMOVED: is_deleted filter
            courses = Course.query.filter_by(status=status).all()

            return {"success": True, "data": [course.to_dict() for course in courses]}
        except Exception as e:
            current_app.logger.error(f"Error getting courses by status: {str(e)}")
            return {"success": False, "error": str(e)}

    # ✅ THÊM MỚI: Lấy các khóa học có prerequisite
    def get_courses_with_prerequisite(self) -> Dict[str, Any]:
        """Lấy danh sách khóa học có khóa học tiên quyết"""
        try:
            courses = Course.query.filter(Course.cou_course_id.isnot(None)).all()

            return {
                "success": True,
                "data": [
                    course.to_dict(include_prerequisite=True) for course in courses
                ],
            }
        except Exception as e:
            current_app.logger.error(
                f"Error getting courses with prerequisite: {str(e)}"
            )
            return {"success": False, "error": str(e)}

    # ✅ THÊM MỚI: Lấy các khóa học phụ thuộc vào một khóa học
    def get_dependent_courses(self, course_id: str) -> Dict[str, Any]:
        """Lấy danh sách khóa học phụ thuộc vào một khóa học (courses có course_id này là prerequisite)"""
        try:
            course = Course.query.filter_by(course_id=course_id).first()
            if not course:
                return {"success": False, "error": "Course not found"}

            # Sử dụng relationship dependent_courses
            dependent_courses = (
                course.dependent_courses if hasattr(course, "dependent_courses") else []
            )

            return {
                "success": True,
                "data": [dep_course.to_dict() for dep_course in dependent_courses],
            }
        except Exception as e:
            current_app.logger.error(f"Error getting dependent courses: {str(e)}")
            return {"success": False, "error": str(e)}

    # ✅ THÊM MỚI: Lấy khóa học theo level
    def get_courses_by_level(self, level: str) -> Dict[str, Any]:
        """Lấy danh sách khóa học theo level"""
        try:
            valid_levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
            if level not in valid_levels:
                return {"success": False, "error": "Invalid level"}

            courses = Course.query.filter_by(level=level).all()

            return {"success": True, "data": [course.to_dict() for course in courses]}
        except Exception as e:
            current_app.logger.error(f"Error getting courses by level: {str(e)}")
            return {"success": False, "error": str(e)}
