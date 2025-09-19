from flask import Blueprint, jsonify, request
from app.config import db
from app.models.course_model import Course

course_bp = Blueprint("courses", __name__, url_prefix="/api/courses")


@course_bp.route("/", methods=["GET"])
def get_courses():
    """Lấy danh sách tất cả courses"""
    try:
        courses = Course.query.all()
        return jsonify(
            {
                "success": True,
                "data": [course.to_dict() for course in courses],
                "count": len(courses),
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@course_bp.route("/", methods=["POST"])
def create_course():
    """Tạo course mới"""
    try:
        data = request.get_json()

        # Validation
        if not data or not data.get("course_id") or not data.get("course_name"):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "course_id and course_name are required",
                    }
                ),
                400,
            )

        # Kiểm tra course_id đã tồn tại chưa
        existing_course = Course.query.filter_by(course_id=data["course_id"]).first()
        if existing_course:
            return jsonify({"success": False, "error": "Course ID already exists"}), 409

        course = Course(
            course_id=data["course_id"],
            course_name=data["course_name"],
            course_description=data.get("course_description"),
            course_status=data.get("course_status", "ACTIVE"),
        )

        db.session.add(course)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Course created successfully",
                    "data": course.to_dict(),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@course_bp.route("/<course_id>", methods=["GET"])
def get_course(course_id):
    """Lấy thông tin course theo ID"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"success": False, "error": "Course not found"}), 404

        return jsonify({"success": True, "data": course.to_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@course_bp.route("/<course_id>", methods=["PUT"])
def update_course(course_id):
    """Cập nhật thông tin course"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"success": False, "error": "Course not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Cập nhật các field
        if "course_name" in data:
            course.course_name = data["course_name"]
        if "course_description" in data:
            course.course_description = data["course_description"]
        if "course_status" in data:
            course.course_status = data["course_status"]

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Course updated successfully",
                "data": course.to_dict(),
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@course_bp.route("/<course_id>", methods=["DELETE"])
def delete_course(course_id):
    """Xóa course"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"success": False, "error": "Course not found"}), 404

        db.session.delete(course)
        db.session.commit()

        return jsonify({"success": True, "message": "Course deleted successfully"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@course_bp.route("/test", methods=["GET"])
def test_course_db():
    """Test database connection với Course"""
    try:
        # Kiểm tra course đã tồn tại chưa
        existing_course = Course.query.filter_by(course_id="TEST001").first()

        if not existing_course:
            course = Course(
                course_id="TEST001",
                course_name="Test Course",
                course_description="This is a test course",
                course_status="ACTIVE",
            )
            db.session.add(course)
            db.session.commit()

        courses = Course.query.all()
        return jsonify(
            {
                "success": True,
                "message": "Course database connection successful!",
                "courses_count": len(courses),
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
