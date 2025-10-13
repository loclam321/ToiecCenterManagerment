from datetime import date
from typing import Any, Dict, List, Tuple

from sqlalchemy.orm import joinedload

from app.config import db
from app.models.enrollment_model import Enrollment
from app.models.class_model import Class
from app.models.lesson_model import Lesson
from app.models.learning_path_model import LearningPath
from app.models.part_model import Part
from app.models.item_model import Item
from app.models.choice_model import Choice
from app.models.course_model import Course


class LessonService:
    """Domain service cung cấp dữ liệu bài học theo lộ trình hàng tuần."""

    def __init__(self, database=None) -> None:
        self.db = database or db

    @staticmethod
    def _lesson_group_key(lesson_id: int) -> str:
        return f"lesson-{lesson_id}"

    def _collect_enrollments(self, user_id: str, class_id: int | None = None) -> List[Enrollment]:
        query = (
            Enrollment.query.options(
                joinedload(Enrollment.class_obj)
                .joinedload(Class.course)
                .joinedload(Course.learning_path)
            )
            .filter(Enrollment.user_id == user_id)
        )
        if class_id is not None:
            query = query.filter(Enrollment.class_id == class_id)
        return query.all()

    def get_lessons_for_student(self, user_id: str, class_id: int | None = None) -> Dict[str, Any]:
        """Trả về danh sách bài học đã mở khóa kèm trạng thái cho học viên."""

        enrollments = self._collect_enrollments(user_id, class_id)
        if not enrollments:
            return {
                "success": True,
                "data": {"lessons": [], "classes": []},
            }

        today = date.today()
        lp_to_class: Dict[int, Dict[str, Any]] = {}
        classes_payload: List[Dict[str, Any]] = []

        for enrollment in enrollments:
            cls = enrollment.class_obj
            if not cls or not cls.course:
                continue
            course = cls.course
            learning_path: LearningPath | None = getattr(course, "learning_path", None)
            if not learning_path or learning_path.lp_id is None:
                continue

            class_info = {
                "class_id": cls.class_id,
                "class_name": cls.class_name,
                "course_id": course.course_id,
                "course_name": course.course_name,
                "learning_path_id": learning_path.lp_id,
                "learning_path_name": learning_path.lp_name,
            }
            classes_payload.append(class_info)
            lp_to_class.setdefault(learning_path.lp_id, class_info)

        lp_ids = list(lp_to_class.keys())
        if not lp_ids:
            return {
                "success": True,
                "data": {"lessons": [], "classes": classes_payload},
            }

        lessons = (
            Lesson.query.options(joinedload(Lesson.part))
            .filter(Lesson.lp_id.in_(lp_ids))
            .order_by(Lesson.lp_id.asc(), Lesson.ls_date.asc(), Lesson.ls_id.asc())
            .all()
        )

        if not lessons:
            return {
                "success": True,
                "data": {"lessons": [], "classes": classes_payload},
            }

        group_keys = [self._lesson_group_key(lesson.ls_id) for lesson in lessons]
        items = (
            Item.query.filter(Item.item_group_key.in_(group_keys))
            .with_entities(Item.item_group_key, Item.item_id)
            .all()
        )

        question_count_map: Dict[str, int] = {}
        for key, _ in items:
            question_count_map[key] = question_count_map.get(key, 0) + 1

        lp_week_tracker: Dict[int, int] = {}
        lessons_payload: List[Dict[str, Any]] = []

        for lesson in lessons:
            lp_id = lesson.lp_id
            class_info = lp_to_class.get(lp_id)
            part: Part | None = lesson.part
            group_key = self._lesson_group_key(lesson.ls_id)
            week_index = lp_week_tracker.get(lp_id, 0) + 1
            lp_week_tracker[lp_id] = week_index

            is_unlocked = lesson.ls_date is None or lesson.ls_date <= today

            lessons_payload.append(
                {
                    "lesson_id": lesson.ls_id,
                    "lesson_name": lesson.ls_name,
                    "available_from": lesson.ls_date.isoformat() if lesson.ls_date else None,
                    "is_unlocked": is_unlocked,
                    "video_link": lesson.ls_link,
                    "week_index": week_index,
                    "question_count": question_count_map.get(group_key, 0),
                    "class": class_info,
                    "part": {
                        "part_id": part.part_id if part else None,
                        "part_code": part.part_code if part else None,
                        "part_name": part.part_name if part else None,
                        "part_section": part.part_section if part else None,
                    },
                }
            )

        return {
            "success": True,
            "data": {"lessons": lessons_payload, "classes": classes_payload},
        }

    def get_lesson_detail(self, user_id: str, lesson_id: int) -> Dict[str, Any]:
        lesson: Lesson | None = (
            Lesson.query.options(joinedload(Lesson.part), joinedload(Lesson.learning_path))
            .filter(Lesson.ls_id == lesson_id)
            .first()
        )
        if not lesson:
            return {"success": False, "error": "Lesson not found", "status": 404}

        learning_path = lesson.learning_path
        target_course_id: str | None = getattr(learning_path, "course_id", None)

        enrollment = (
            Enrollment.query.join(Class, Enrollment.class_id == Class.class_id)
            .filter(Enrollment.user_id == user_id)
        )
        if target_course_id:
            enrollment = enrollment.filter(Class.course_id == target_course_id)
        enrollment = enrollment.first()

        if not enrollment:
            return {
                "success": False,
                "error": "Lesson unavailable for this student",
                "status": 403,
            }

        today = date.today()
        is_unlocked = lesson.ls_date is None or lesson.ls_date <= today
        if not is_unlocked:
            return {
                "success": False,
                "error": "Lesson is locked for this week",
                "status": 403,
            }

        group_key = self._lesson_group_key(lesson.ls_id)
        items: List[Item] = (
            Item.query.options(joinedload(Item.choices))
            .filter(Item.item_group_key == group_key)
            .order_by(Item.item_order_in_part.asc(), Item.item_id.asc())
            .all()
        )

        if not items:
            items = (
                Item.query.options(joinedload(Item.choices))
                .filter(Item.part_id == lesson.part_id)
                .order_by(Item.item_order_in_part.asc(), Item.item_id.asc())
                .limit(20)
                .all()
            )

        question_payload: List[Dict[str, Any]] = []
        for idx, item in enumerate(items, start=1):
            question_payload.append(
                {
                    "item_id": item.item_id,
                    "order": idx,
                    "item_group_key": item.item_group_key,
                    "item_stimulus_text": item.item_stimulus_text,
                    "item_question_text": item.item_question_text,
                    "item_image_path": item.item_image_path,
                    "item_audio_path": item.item_audio_path,
                    "choices": [
                        {
                            "choice_id": choice.choice_id,
                            "choice_label": choice.choice_label,
                            "choice_content": choice.choice_content,
                        }
                        for choice in sorted(item.choices, key=lambda c: c.choice_label)
                    ],
                }
            )

        part = lesson.part
        class_info = {
            "class_id": enrollment.class_id,
            "class_name": enrollment.class_obj.class_name if enrollment.class_obj else None,
            "course_id": enrollment.class_obj.course_id if enrollment.class_obj else None,
        }

        learning_path_payload = (
            {
                "learning_path_id": learning_path.lp_id,
                "learning_path_name": learning_path.lp_name,
                "summary": learning_path.lp_summary,
                "description": learning_path.lp_desciption,
                "intro_video_url": learning_path.intro_video_url,
            }
            if learning_path
            else None
        )

        lesson_payload = {
            "lesson_id": lesson.ls_id,
            "lesson_name": lesson.ls_name,
            "available_from": lesson.ls_date.isoformat() if lesson.ls_date else None,
            "video_link": lesson.ls_link,
            "part": {
                "part_id": part.part_id if part else None,
                "part_code": part.part_code if part else None,
                "part_name": part.part_name if part else None,
                "part_section": part.part_section if part else None,
            },
            "class": class_info,
            "learning_path": learning_path_payload,
        }

        return {
            "success": True,
            "data": {
                "lesson": lesson_payload,
                "questions": question_payload,
            },
        }

    def _build_question_map(self, lesson_id: int) -> Dict[int, Tuple[Item, Dict[int, Choice]]]:
        group_key = self._lesson_group_key(lesson_id)
        items: List[Item] = (
            Item.query.options(joinedload(Item.choices))
            .filter(Item.item_group_key == group_key)
            .order_by(Item.item_order_in_part.asc(), Item.item_id.asc())
            .all()
        )
        result: Dict[int, Tuple[Item, Dict[int, Choice]]] = {}
        for item in items:
            choice_map = {choice.choice_id: choice for choice in item.choices}
            result[item.item_id] = (item, choice_map)
        return result

    def submit_lesson_quiz(self, user_id: str, lesson_id: int, responses: List[Dict[str, Any]]):
        lesson: Lesson | None = Lesson.query.filter(Lesson.ls_id == lesson_id).first()
        if not lesson:
            return {"success": False, "error": "Lesson not found", "status": 404}

        detail = self.get_lesson_detail(user_id, lesson_id)
        if not detail.get("success"):
            return detail

        question_map = self._build_question_map(lesson_id)
        total_questions = len(question_map)
        if total_questions == 0:
            return {
                "success": False,
                "error": "No questions configured for this lesson",
                "status": 400,
            }

        answered = 0
        correct = 0
        detailed_results: List[Dict[str, Any]] = []

        response_map = {}
        for resp in responses or []:
            try:
                item_id = int(resp.get("item_id"))
                choice_id = int(resp.get("choice_id"))
            except (TypeError, ValueError):
                continue
            response_map[item_id] = choice_id

        for order, (item_id, (item, choice_map)) in enumerate(question_map.items(), start=1):
            selected_choice_id = response_map.get(item_id)
            selected_choice = (
                choice_map.get(selected_choice_id) if selected_choice_id else None
            )
            correct_choice = next(
                (choice for choice in choice_map.values() if choice.choice_is_correct),
                None,
            )
            is_correct = bool(selected_choice and selected_choice.choice_is_correct)
            if selected_choice is not None:
                answered += 1
                if is_correct:
                    correct += 1

            detailed_results.append(
                {
                    "item_id": item_id,
                    "order": order,
                    "question_text": item.item_question_text,
                    "selected_choice_id": selected_choice.choice_id if selected_choice else None,
                    "selected_choice_label": selected_choice.choice_label if selected_choice else None,
                    "is_correct": is_correct,
                    "correct_choice_id": correct_choice.choice_id if correct_choice else None,
                    "correct_choice_label": correct_choice.choice_label if correct_choice else None,
                }
            )

        percentage = (correct / total_questions * 100) if total_questions else 0

        return {
            "success": True,
            "data": {
                "lesson_id": lesson.ls_id,
                "lesson_name": lesson.ls_name,
                "total_questions": total_questions,
                "answered": answered,
                "correct": correct,
                "incorrect": answered - correct,
                "score_percentage": round(percentage, 2),
                "score_out_of_10": round((percentage / 10), 2),
                "details": detailed_results,
            },
        }
