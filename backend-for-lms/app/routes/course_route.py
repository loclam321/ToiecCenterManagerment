from flask import Blueprint, request
from app.services.course_service import CourseService
from app.utils.response_helper import success_response, error_response, validation_error_response, not_found_response
from app.utils.validators import Validator
from app.config import db
from app.models.learning_path_model import LearningPath
from app.models.course_model import Course
from sqlalchemy import literal_column
from sqlalchemy.exc import OperationalError


course_bp = Blueprint("course", __name__, url_prefix="/api/courses")
course_service = CourseService()


@course_bp.route("/", methods=["GET"])
def list_courses():
    try:
        status = request.args.get("status", type=str)
        courses = course_service.get_all(status=status)
        data = [c.to_dict() for c in courses if hasattr(c, "to_dict")]
        return success_response({"courses": data})
    except Exception as e:
        return error_response(f"Lỗi khi lấy danh sách khóa học: {str(e)}", 500)


@course_bp.route("/<course_id>/toggle", methods=["PATCH"]) 
def toggle_course_status(course_id):
    try:
        course = course_service.toggle_status(course_id)
        if not course:
            return not_found_response("Không tìm thấy khóa học", "Course", course_id)
        return success_response({"course": course.to_dict()}, "Đã đổi trạng thái khóa học")
    except Exception as e:
        return error_response(f"Lỗi khi đổi trạng thái khóa học: {str(e)}", 500)


@course_bp.route("/<course_id>/status", methods=["PUT"]) 
def set_course_status(course_id):
    try:
        body = request.get_json() or {}
        status = body.get("status") or body.get("course_status")
        if not status:
            return validation_error_response("Dữ liệu không hợp lệ", {"status": "status is required"})

        # Map legacy ACTIVE/INACTIVE/DRAFT to new statuses
        legacy_map = {"ACTIVE": "OPEN", "INACTIVE": "CLOSED", "DRAFT": "DRAFT"}
        normalized = legacy_map.get(status.upper(), status)

        updated = course_service.update(course_id, {"status": normalized})
        if not updated:
            return not_found_response("Không tìm thấy khóa học hoặc không thể cập nhật", "Course", course_id)
        return success_response({"course": updated.to_dict()}, "Đã cập nhật trạng thái khóa học")
    except Exception as e:
        return error_response(f"Lỗi khi cập nhật trạng thái khóa học: {str(e)}", 500)


@course_bp.route("/learning-paths", methods=["GET"]) 
def list_learning_paths_with_course():
    try:
        # Try with new column name first
        try:
            results = (
                db.session.query(
                    LearningPath,
                    Course,
                    literal_column("courses.status").label("status_col"),
                )
                .join(Course, LearningPath.course_id == Course.course_id)
                .all()
            )
        except OperationalError:
            results = (
                db.session.query(
                    LearningPath,
                    Course,
                    literal_column("courses.course_status").label("status_col"),
                )
                .join(Course, LearningPath.course_id == Course.course_id)
                .all()
            )

        data = []
        for lp, course, status_col in results:
            item = lp.to_dict() if hasattr(lp, "to_dict") else {}
            item.update({
                "course_status": status_col,
                "course_name": course.course_name,
            })
            data.append(item)

        return success_response({"learning_paths": data})
    except Exception as e:
        return error_response(f"Lỗi khi lấy danh sách lộ trình: {str(e)}", 500)


@course_bp.route("/summary", methods=["GET"]) 
def courses_summary():
    try:
        # Đếm số learning paths theo course - try new column then fallback to legacy
        try:
            results = (
                db.session.query(
                    Course.course_id,
                    Course.course_name,
                    literal_column("courses.status"),
                    db.func.count(LearningPath.lp_id),
                )
                .outerjoin(LearningPath, LearningPath.course_id == Course.course_id)
                .group_by(Course.course_id, Course.course_name, literal_column("courses.status"))
                .order_by(Course.course_id)
                .all()
            )
        except OperationalError:
            results = (
                db.session.query(
                    Course.course_id,
                    Course.course_name,
                    literal_column("courses.course_status"),
                    db.func.count(LearningPath.lp_id),
                )
                .outerjoin(LearningPath, LearningPath.course_id == Course.course_id)
                .group_by(Course.course_id, Course.course_name, literal_column("courses.course_status"))
                .order_by(Course.course_id)
                .all()
            )
        data = [
            {
                "course_id": r[0],
                "course_name": r[1],
                "course_status": r[2],
                "learning_path_count": int(r[3]) if r[3] is not None else 0,
            }
            for r in results
        ]
        return success_response({"courses": data})
    except Exception as e:
        return error_response(f"Lỗi khi lấy tổng quan khóa học: {str(e)}", 500)


@course_bp.route("/<course_id>/learning-paths", methods=["GET"]) 
def learning_paths_by_course(course_id):
    try:
        course = db.session.query(Course).filter_by(course_id=course_id).first()
        if not course:
            return not_found_response("Không tìm thấy khóa học", "Course", course_id)

        lps = (
            db.session.query(LearningPath)
            .filter(LearningPath.course_id == course_id)
            .all()
        )
        data = [lp.to_dict() for lp in lps]
        return success_response({"course": course.to_dict(), "learning_paths": data})
    except Exception as e:
        return error_response(f"Lỗi khi lấy lộ trình của khóa học: {str(e)}", 500)


