from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_, and_

from app.config import db
from app.models.class_model import Class
from app.models.course_model import Course
from app.models.enrollment_model import Enrollment
from app.models.student_model import Student
from app.models.schedule_model import Schedule


class ClassService:
    """Service quản lý lớp học"""

    def __init__(self, database=None):
        self.db = database or db

    def get_all_classes(
        self, page: int = 1, per_page: int = 10, filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
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
                    # Sử dụng phương thức is_active() từ model
                    query = query.filter(Class.class_status == "ACTIVE")

                if filters.get("available_only") is True:
                    # Lớp còn slot và đang active - sử dụng logic từ is_full()
                    query = query.filter(
                        and_(
                            Class.class_status == "ACTIVE",
                            or_(
                                Class.class_maxstudents.is_(None),
                                Class.class_currentenrollment < Class.class_maxstudents,
                            ),
                        )
                    )

                if filters.get("ongoing") is True:
                    # Sử dụng logic từ is_ongoing()
                    today = date.today()
                    query = query.filter(
                        and_(
                            Class.class_startdate <= today, Class.class_enddate >= today
                        )
                    )

                # Search by name
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(Class.class_name.like(search_term))

                # Lọc theo thời gian
                if filters.get("start_date"):
                    start_date = datetime.strptime(
                        filters["start_date"], "%Y-%m-%d"
                    ).date()
                    query = query.filter(Class.class_startdate >= start_date)

                if filters.get("end_date"):
                    end_date = datetime.strptime(filters["end_date"], "%Y-%m-%d").date()
                    query = query.filter(Class.class_enddate <= end_date)

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

            # Xử lý trạng thái lớp học dựa trên lịch học
            today = date.today()
            result_data = []

            for class_obj in classes:
                class_dict = class_obj.to_dict()

                # Kiểm tra lịch học của lớp
                schedules = Schedule.query.filter_by(class_id=class_obj.class_id).all()
                has_schedules = len(schedules) > 0

                # Cập nhật trạng thái dựa trên điều kiện
                if class_obj.class_enddate and class_obj.class_enddate < today:
                    # Nếu ngày kết thúc đã qua
                    class_dict["display_status"] = "Đã hoàn thành"
                elif has_schedules:
                    if not class_obj.class_status:
                        # Có lịch học và trạng thái rỗng
                        class_dict["display_status"] = "Đã lên lịch"
                    elif class_obj.class_status == "ACTIVE":
                        # Có lịch học và trạng thái ACTIVE
                        class_dict["display_status"] = "Đã xác nhận"
                    else:
                        class_dict["display_status"] = class_obj.class_status
                else:
                    class_dict["display_status"] = (
                        class_obj.class_status or "Chưa lên lịch"
                    )

                result_data.append(class_dict)

            return {
                "success": True,
                "data": result_data,
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
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            result = class_obj.to_dict()

            # Bổ sung thêm thông tin từ course (nếu có)
            if class_obj.course:
                result["course"] = {
                    "course_id": class_obj.course.course_id,
                    "course_name": class_obj.course.course_name,
                    "course_code": getattr(class_obj.course, "course_code", None),
                }

            # Xử lý trạng thái lớp học dựa trên lịch học - áp dụng cùng logic
            today = date.today()

            # Kiểm tra lịch học của lớp
            schedules = Schedule.query.filter_by(class_id=class_obj.class_id).all()
            has_schedules = len(schedules) > 0

            # Cập nhật trạng thái dựa trên điều kiện
            if class_obj.class_enddate and class_obj.class_enddate < today:
                # Nếu ngày kết thúc đã qua
                result["display_status"] = "Đã hoàn thành"
            elif has_schedules:
                if not class_obj.class_status:
                    # Có lịch học và trạng thái rỗng
                    result["display_status"] = "Đã lên lịch"
                elif class_obj.class_status == "ACTIVE":
                    # Có lịch học và trạng thái ACTIVE
                    result["display_status"] = "Đã xác nhận"
                else:
                    result["display_status"] = class_obj.class_status
            else:
                result["display_status"] = class_obj.class_status or "Chưa lên lịch"

            return {"success": True, "data": result}
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
                return {
                    "success": False,
                    "error": f"Course with ID {data['course_id']} not found",
                }

            # Xử lý các trường ngày tháng
            start_date = None
            if "class_startdate" in data and data["class_startdate"]:
                if isinstance(data["class_startdate"], str):
                    start_date = datetime.strptime(
                        data["class_startdate"], "%Y-%m-%d"
                    ).date()
                else:
                    start_date = data["class_startdate"]

            end_date = None
            if "class_enddate" in data and data["class_enddate"]:
                if isinstance(data["class_enddate"], str):
                    end_date = datetime.strptime(
                        data["class_enddate"], "%Y-%m-%d"
                    ).date()
                else:
                    end_date = data["class_enddate"]

            # Validate ngày bắt đầu và kết thúc
            if start_date and end_date and start_date > end_date:
                return {"success": False, "error": "Start date must be before end date"}

            # Tạo lớp học mới
            class_obj = Class(
                course_id=data["course_id"],
                class_name=data.get("class_name", course.course_name),
                class_startdate=start_date,
                class_enddate=end_date,
                class_maxstudents=data.get("class_maxstudents"),
                class_currentenrollment=data.get("class_currentenrollment", 0),
                class_status=data.get("class_status", ""),
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
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            # Cập nhật các trường dữ liệu
            if "class_name" in data:
                class_obj.class_name = data["class_name"]

            if "class_startdate" in data:
                if isinstance(data["class_startdate"], str):
                    class_obj.class_startdate = datetime.strptime(
                        data["class_startdate"], "%Y-%m-%d"
                    ).date()
                else:
                    class_obj.class_startdate = data["class_startdate"]

            if "class_enddate" in data:
                if isinstance(data["class_enddate"], str):
                    class_obj.class_enddate = datetime.strptime(
                        data["class_enddate"], "%Y-%m-%d"
                    ).date()
                else:
                    class_obj.class_enddate = data["class_enddate"]

            # Validate ngày bắt đầu và kết thúc
            if (
                class_obj.class_startdate
                and class_obj.class_enddate
                and class_obj.class_startdate > class_obj.class_enddate
            ):
                return {"success": False, "error": "Start date must be before end date"}

            if "class_maxstudents" in data:
                class_obj.class_maxstudents = data["class_maxstudents"]

            if "class_currentenrollment" in data:
                class_obj.class_currentenrollment = data["class_currentenrollment"]

            if "class_status" in data:
                class_obj.class_status = data["class_status"]

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
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            if soft_delete:
                # Soft delete bằng cách đổi status
                class_obj.class_status = "DELETED"
                self.db.session.commit()
            else:
                # Hard delete - kiểm tra các ràng buộc
                # Kiểm tra xem có enrollments không
                enrollments = Enrollment.query.filter_by(class_id=class_id).first()
                if enrollments:
                    return {
                        "success": False,
                        "error": "Cannot delete class with existing enrollments. Use soft delete or remove enrollments first.",
                    }

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
            # Kiểm tra lớp học tồn tại
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            # Kiểm tra trạng thái lớp học - sử dụng phương thức is_active() từ model
            if not class_obj.is_active():
                return {"success": False, "error": "Cannot enroll in inactive class"}

            # Kiểm tra lớp học đã đầy chưa - sử dụng phương thức is_full() từ model
            if class_obj.is_full():
                return {"success": False, "error": "Class is already full"}

            # Kiểm tra sinh viên tồn tại
            student = Student.query.get(student_id)
            if not student:
                return {
                    "success": False,
                    "error": f"Student with ID {student_id} not found",
                }

            # Kiểm tra đã đăng ký trước đó chưa
            existing_enrollment = Enrollment.query.filter_by(
                user_id=student_id, class_id=class_id
            ).first()
            from app.models.course_model import Course
            
            course = Course.query.get(class_obj.course_id)
            if course:
                pre_course_id = course.get_cou_course_id()
                if pre_course_id:
                    # Kiểm tra khóa học tiên quyết
                    pre_course = Course.query.get(pre_course_id)
                    if pre_course:
                        # Lấy danh sách lớp học đã hoàn thành của sinh viên
                        completed_classes = (
                            db.session.query(Class)
                            .join(Enrollment, Enrollment.class_id == Class.class_id)
                            .filter(
                                Enrollment.user_id == student_id,
                                Class.class_status == "COMPLETED",
                                Class.course_id == pre_course_id,
                            )
                            .all()
                        )
                        if not completed_classes:
                            return {
                                "success": False,
                                "error": f"Học viên phải hoàn thành khóa học {pre_course.course_name} trước khi đăng ký.",
                            }

            if existing_enrollment:
                # Nếu đã drop, có thể re-enroll
                if existing_enrollment.status == "DROPPED":
                    existing_enrollment.status = "ACTIVE"
                    existing_enrollment.updated_at = func.now()
                else:
                    return {
                        "success": False,
                        "error": "Student already enrolled in this class",
                    }
            else:
                # Tạo bản ghi enrollment mới
                enrollment = Enrollment(
                    user_id=student_id, class_id=class_id, status="ACTIVE"
                )
                self.db.session.add(enrollment)

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
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            # Tìm và cập nhật enrollment record
            enrollment = Enrollment.query.filter_by(
                user_id=student_id, class_id=class_id, status="ACTIVE"
            ).first()

            if not enrollment:
                return {
                    "success": False,
                    "error": "Student not enrolled in this class or already dropped",
                }

            # Cập nhật trạng thái thành DROPPED
            enrollment.status = "DROPPED"
            enrollment.updated_at = func.now()

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
                "data": [class_obj.to_dict() for class_obj in classes],
            }

        except Exception as e:
            current_app.logger.error(f"Error in get_classes_by_course: {str(e)}")
            return {"success": False, "error": f"Error retrieving classes: {str(e)}"}

    def get_active_classes(self) -> Dict[str, Any]:
        """
        Lấy danh sách lớp học đang hoạt động

        Returns:
            Dict chứa danh sách lớp học đang active
        """
        try:
            # Sử dụng trực tiếp phương thức class_status
            active_classes = Class.query.filter_by(class_status="ACTIVE").all()

            return {
                "success": True,
                "data": [class_obj.to_dict() for class_obj in active_classes],
            }

        except Exception as e:
            current_app.logger.error(f"Error in get_active_classes: {str(e)}")
            return {
                "success": False,
                "error": f"Error retrieving active classes: {str(e)}",
            }

    def get_ongoing_classes(self) -> Dict[str, Any]:
        """
        Lấy danh sách lớp học đang trong thời gian học

        Returns:
            Dict chứa danh sách lớp học đang diễn ra
        """
        try:
            today = date.today()
            # Sử dụng logic từ is_ongoing() của model
            ongoing_classes = Class.query.filter(
                and_(
                    Class.class_startdate <= today,
                    Class.class_enddate >= today,
                    Class.class_status == "ACTIVE",
                )
            ).all()

            return {
                "success": True,
                "data": [class_obj.to_dict() for class_obj in ongoing_classes],
            }

        except Exception as e:
            current_app.logger.error(f"Error in get_ongoing_classes: {str(e)}")
            return {
                "success": False,
                "error": f"Error retrieving ongoing classes: {str(e)}",
            }

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
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            # Tính toán các chỉ số - sử dụng các phương thức helper từ model
            enrollment_rate = 0
            if class_obj.class_maxstudents and class_obj.class_maxstudents > 0:
                enrollment_rate = (
                    class_obj.class_currentenrollment / class_obj.class_maxstudents
                ) * 100

            # Đếm số buổi học nếu có bảng schedules
            session_count = 0
            try:
                session_count = Schedule.query.filter_by(class_id=class_id).count()
            except ImportError:
                # Bỏ qua nếu không có model Schedule
                pass

            metrics = {
                "class_id": class_obj.class_id,
                "class_name": class_obj.class_name,
                "current_enrollment": class_obj.class_currentenrollment,
                "max_students": class_obj.class_maxstudents,
                "enrollment_rate": enrollment_rate,
                "is_full": class_obj.is_full(),
                "is_active": class_obj.is_active(),
                "is_ongoing": class_obj.is_ongoing(),
                "session_count": session_count,
                "course_id": class_obj.course_id,
                "course_name": (
                    class_obj.course.course_name if class_obj.course else None
                ),
            }

            return {"success": True, "data": metrics}

        except Exception as e:
            current_app.logger.error(f"Error in get_class_metrics: {str(e)}")
            return {
                "success": False,
                "error": f"Error retrieving class metrics: {str(e)}",
            }

    def get_class_students(
        self, class_id: int, page: int = 1, per_page: int = 10
    ) -> Dict[str, Any]:
        """
        Lấy danh sách học viên đã đăng ký vào lớp học

        Args:
            class_id: ID của lớp học
            page: Trang hiện tại
            per_page: Số lượng học viên mỗi trang

        Returns:
            Dict chứa danh sách học viên và thông tin phân trang
        """
        try:
            # Kiểm tra lớp học tồn tại
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            # Sử dụng join để lấy danh sách học viên đã đăng ký
            query = Student.query.join(
                Enrollment, Enrollment.user_id == Student.user_id
            ).filter(
                Enrollment.class_id == class_id,
                Enrollment.status != "DROPPED",  # Chỉ lấy học viên còn đang học
            )

            # Áp dụng phân trang
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            students = pagination.items

            return {
                "success": True,
                "data": [student.to_dict() for student in students],
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
            current_app.logger.error(f"Error in get_class_students: {str(e)}")
            return {"success": False, "error": f"Error retrieving students: {str(e)}"}

    def get_class_enrollments_with_students(
        self, class_id: int, page: int = 1, per_page: int = 10, status: str = None
    ) -> Dict[str, Any]:
        """
        Lấy danh sách ghi danh kèm thông tin học viên của lớp học

        Args:
            class_id: ID của lớp học
            page: Trang hiện tại
            per_page: Số lượng học viên mỗi trang
            status: Lọc theo trạng thái ghi danh (ACTIVE, COMPLETED, DROPPED)

        Returns:
            Dict chứa danh sách ghi danh và thông tin phân trang
        """
        try:
            # Kiểm tra lớp học tồn tại
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {
                    "success": False,
                    "error": f"Class with ID {class_id} not found",
                }

            # Lấy danh sách ghi danh
            # Tạo query base
            query = Enrollment.query.filter_by(class_id=class_id)

            # Áp dụng lọc theo status nếu có
            if status:
                query = query.filter_by(status=status)

            # Áp dụng phân trang
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            enrollments = pagination.items

            # Tạo kết quả với thông tin học viên đầy đủ
            result_data = []
            for enrollment in enrollments:
                enrollment_dict = enrollment.to_dict()
                # Lấy thông tin student từ relationship
                student = Student.query.get(enrollment.user_id)
                if student:
                    enrollment_dict["student"] = student.to_dict()
                result_data.append(enrollment_dict)

            return {
                "success": True,
                "data": result_data,
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
            current_app.logger.error(
                f"Error in get_class_enrollments_with_students: {str(e)}"
            )
            return {
                "success": False,
                "error": f"Error retrieving enrollments: {str(e)}",
            }

    def get_classes_list(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Lấy danh sách lớp học không phân trang, với trạng thái được xác định dựa trên logic nghiệp vụ

        Args:
            filters: Các tiêu chí lọc (course_id, status, active_only, etc.)

        Returns:
            Dict chứa danh sách lớp học và thông tin về số lượng
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
                    query = query.filter(
                        and_(
                            Class.class_status == "ACTIVE",
                            or_(
                                Class.class_maxstudents.is_(None),
                                Class.class_currentenrollment < Class.class_maxstudents,
                            ),
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

            # Lấy tất cả lớp học phù hợp với filter
            classes = query.all()

            # Xử lý trạng thái lớp học dựa trên lịch học
            today = date.today()
            result_data = []

            for class_obj in classes:
                class_dict = class_obj.to_dict()

                # Kiểm tra lịch học của lớp
                schedules = Schedule.query.filter_by(class_id=class_obj.class_id).all()
                has_schedules = len(schedules) > 0

                # Cập nhật trạng thái dựa trên điều kiện
                if class_obj.class_enddate and class_obj.class_enddate < today:
                    # Nếu ngày kết thúc đã qua
                    class_dict["display_status"] = "Đã hoàn thành"
                elif has_schedules:
                    if not class_obj.class_status:
                        # Có lịch học và trạng thái rỗng
                        class_dict["display_status"] = "Đã lên lịch"
                    elif class_obj.class_status == "ACTIVE":
                        # Có lịch học và trạng thái ACTIVE
                        class_dict["display_status"] = "Đã xác nhận"
                    else:
                        class_dict["display_status"] = class_obj.class_status
                else:
                    class_dict["display_status"] = (
                        class_obj.class_status or "Chưa lên lịch"
                    )

                result_data.append(class_dict)

            return {"success": True, "data": result_data, "total": len(result_data)}

        except Exception as e:
            current_app.logger.error(f"Error in get_classes_list: {str(e)}")
            return {"success": False, "error": f"Error retrieving classes: {str(e)}"}
