import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app
from app.models.student_model import Student

def main():
    app = create_app()
    with app.app_context():
        students = Student.query.limit(10).all()
        for stu in students:
            print(stu.user_id, stu.user_email, stu.is_email_verified)

if __name__ == "__main__":
    main()
