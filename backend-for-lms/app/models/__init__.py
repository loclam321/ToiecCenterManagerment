"""
Package models - chứa các mô hình SQLAlchemy cho hệ thống LMS
"""

# Import các models từ các file tương ứng
from .user_model import User  # Base model cho Student và Teacher
from .student_model import Student
from .teacher_model import Teacher
from .course_model import Course
from .class_model import Class
from .enrollment_model import Enrollment
from .learning_path_model import LearningPath
from .lesson_model import Lesson
from .part_model import Part
from .item_model import Item
from .choice_model import Choice
from .room_model import Room
from .schedule_model import Schedule
from .test_model import Testq
from .attempt_model import Attempt
from .words_model import Word
from .student_words_model import StudentWords
from .vocabulary_model import Vocabulary

# Cung cấp danh sách tất cả các models cho việc tạo bảng
__all__ = [
    "User",
    "Student",
    "Teacher",
    "Course",
    "Class",
    "Enrollment",
    "LearningPath",
    "Lesson",
    "Part",
    "Item",
    "Choice",
    "Test",
    "Attempt",
    "Room",
    "Schedule",
    "Word",
    "StudentWords",
    "Vocabulary",
]
