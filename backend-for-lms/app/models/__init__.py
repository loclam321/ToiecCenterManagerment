"""
Package models - chứa các mô hình SQLAlchemy cho hệ thống LMS
"""

# Import các models từ các file tương ứng
from .answer_model import Answer
from .class_model import Class
from .course_model import Course
from .enrollment_model import Enrollment
from .learning_path_model import LearningPath
from .lesson_model import Lesson
from .question_model import Question
from .room_model import Room
from .schedule_model import Schedule
from .score_model import Score
from .skill_model import Skill
from .student_model import Student
from .student_words_model import StudentWords
from .teacher_model import Teacher
from .test_model import Test
from .test_question_model import TestQuestion
from .vocabulary_model import Vocabulary
from .words_model import Word
from .user_model import User  # Base model cho Student và Teacher

# Cung cấp danh sách tất cả các models cho việc tạo bảng
__all__ = [
    'User',
    'Student',
    'Teacher',
    'Course',
    'Class',
    'Enrollment',
    'LearningPath',
    'Skill',
    'Lesson',
    'Question',
    'Answer',
    'Test',
    'TestQuestion',
    'Score',
    'Room',
    'Schedule',
    'Word',
    'StudentWords',
    'Vocabulary',
]


