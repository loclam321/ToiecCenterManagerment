from flask import Blueprint, jsonify
from app.config import db
from app.models.course_model import Course

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return {"message": "LMS Backend is running!"}


@main.route("/test-db")
def test_db():
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
        return {
            "message": "Database connection successful!",
            "courses_count": len(courses),
        }
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500
