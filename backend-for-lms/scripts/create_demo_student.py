import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app
from app.config import db
from app.models.student_model import Student


def main():
    app = create_app()
    with app.app_context():
        student = Student.query.filter_by(user_email="demo.student@lms.com").first()
        if student:
            print("Student already exists", student.user_id)
            return
        student = Student(
            user_id="STUDEMO1",
            user_name="Demo Student",
            user_email="demo.student@lms.com",
            user_gender="F",
            user_telephone="0909000000",
            sd_startlv="BEGINNER",
            sd_enrollmenttdate=None,
            is_email_verified=True,
        )
        student.set_password("Student@123")
        db.session.add(student)
        db.session.commit()
        print("Created student", student.user_id)


if __name__ == "__main__":
    main()
