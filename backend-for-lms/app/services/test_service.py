from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.config import db
from app.models.attempt_model import Attempt
from app.models.choice_model import Choice
from app.models.class_model import Class
from app.models.enrollment_model import Enrollment
from app.models.item_model import Item
from app.models.part_model import Part
from app.models.schedule_model import Schedule
from app.models.student_model import Student
from app.models.test_model import Test


class TeacherTestService:
    """Domain service xử lý nghiệp vụ bài kiểm tra cho giáo viên."""

    _TEST_GROUP_PREFIX = "test"

    def __init__(self, database=None) -> None:
        self.db = database or db

    # ---------------------------------------------------------------------
    # Helper utilities
    # ---------------------------------------------------------------------
    @staticmethod
    def _group_key(test_id: int) -> str:
        return f"{TeacherTestService._TEST_GROUP_PREFIX}-{test_id}"

    @staticmethod
    def _parse_datetime(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            # Accept both date and datetime inputs
            value_str = value.strip()
            if len(value_str) == 10:
                return datetime.strptime(value_str, "%Y-%m-%d")
            return datetime.fromisoformat(value_str)
        except ValueError as exc:  # pragma: no cover - defensive
            raise ValueError("Datetime fields must be ISO-8601 format") from exc

    def _teacher_classes(self, teacher_id: str | None, allow_all: bool = False) -> Dict[int, Dict[str, Any]]:
        query = Class.query.options(joinedload(Class.course)) if allow_all else (
            Schedule.query.options(joinedload(Schedule.class_obj).joinedload(Class.course))
            .filter(Schedule.user_id == teacher_id)
        )

        class_map: Dict[int, Dict[str, Any]] = {}
        if allow_all:
            for cls in query.all():
                course = getattr(cls, "course", None)
                class_map[cls.class_id] = {
                    "class_id": cls.class_id,
                    "class_name": cls.class_name,
                    "course_id": course.course_id if course else None,
                    "course_name": course.course_name if course else None,
                }
        else:
            for schedule in query.all():
                cls = schedule.class_obj
                if not cls:
                    continue
                course = getattr(cls, "course", None)
                class_map.setdefault(
                    cls.class_id,
                    {
                        "class_id": cls.class_id,
                        "class_name": cls.class_name,
                        "course_id": course.course_id if course else None,
                        "course_name": course.course_name if course else None,
                    },
                )
        return class_map

    def _ensure_teacher_in_class(self, teacher_id: str | None, class_id: int, allow_all: bool = False) -> Dict[str, Any]:
        if allow_all:
            class_obj = Class.query.options(joinedload(Class.course)).filter(Class.class_id == class_id).first()
            if not class_obj:
                raise PermissionError("Class not found")
            course = getattr(class_obj, "course", None)
            return {
                "class_id": class_obj.class_id,
                "class_name": class_obj.class_name,
                "course_id": course.course_id if course else None,
                "course_name": course.course_name if course else None,
            }

        class_map = self._teacher_classes(teacher_id, allow_all=False)
        class_payload = class_map.get(class_id)
        if not class_payload:
            raise PermissionError("Teacher does not have permission for this class")
        return class_payload

    @staticmethod
    def _serialize_choice(choice: Choice) -> Dict[str, Any]:
        return {
            "choice_id": choice.choice_id,
            "label": choice.choice_label,
            "content": choice.choice_content,
            "is_correct": choice.choice_is_correct,
        }

    @staticmethod
    def _serialize_item(item: Item, order: int | None = None) -> Dict[str, Any]:
        return {
            "item_id": item.item_id,
            "order": order if order is not None else item.item_order_in_part,
            "part_id": item.part_id,
            "stimulus_text": item.item_stimulus_text,
            "question_text": item.item_question_text,
            "image_path": item.item_image_path,
            "audio_path": item.item_audio_path,
            "choices": [
                TeacherTestService._serialize_choice(choice)
                for choice in sorted(item.choices, key=lambda c: c.choice_label)
            ],
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get_teacher_test_setup(self, teacher_id: str, *, allow_all: bool = False) -> Dict[str, Any]:
        class_map = self._teacher_classes(teacher_id, allow_all=allow_all)
        parts = [part.to_dict() for part in Part.query.order_by(Part.part_order_in_test.asc()).all()]
        return {
            "success": True,
            "data": {
                "classes": list(class_map.values()),
                "parts": parts,
            },
        }

    def list_tests_for_class(self, teacher_id: str | None, class_id: int, *, allow_all: bool = False) -> Dict[str, Any]:
        class_payload = self._ensure_teacher_in_class(teacher_id, class_id, allow_all=allow_all)

        tests = (
            Test.query.filter(Test.class_id == class_id)
            .order_by(Test.created_at.desc(), Test.test_id.desc())
            .all()
        )
        test_ids = [test.test_id for test in tests]
        if not tests:
            return {
                "success": True,
                "data": {
                    "tests": [],
                    "class": class_payload,
                },
            }

        # Aggregate attempts per test
        attempt_rows = (
            self.db.session.query(
                Attempt.test_id,
                func.count(Attempt.att_id).label("attempt_count"),
                func.max(Attempt.att_raw_score).label("best_score"),
                func.max(Attempt.att_submitted_at).label("last_submitted_at"),
            )
            .filter(Attempt.test_id.in_(test_ids))
            .group_by(Attempt.test_id)
            .all()
        )
        attempt_map = {row.test_id: row for row in attempt_rows}

        total_questions_map: Dict[int, int] = {
            test.test_id: (test.test_total_questions or 0)
            for test in tests
        }
        missing_counts = [tid for tid, total in total_questions_map.items() if not total]
        if missing_counts:
            item_counts = (
                self.db.session.query(Item.test_id, func.count(Item.item_id))
                .filter(Item.test_id.in_(missing_counts))
                .group_by(Item.test_id)
                .all()
            )
            for tid, count in item_counts:
                total_questions_map[tid] = count

        payload_tests: List[Dict[str, Any]] = []
        for test in tests:
            aggregates = attempt_map.get(test.test_id)
            total_questions = total_questions_map.get(test.test_id, 0)
            best_score = getattr(aggregates, "best_score", None) if aggregates else None
            best_score_10 = None
            if best_score is not None and total_questions:
                best_score_10 = round((best_score / total_questions) * 10, 2)

            payload = test.to_dict()
            payload.update(
                {
                    "attempt_count": getattr(aggregates, "attempt_count", 0) if aggregates else 0,
                    "best_score": best_score,
                    "best_score_10": best_score_10,
                    "last_submitted_at": (
                        aggregates.last_submitted_at.isoformat()
                        if aggregates and aggregates.last_submitted_at
                        else None
                    ),
                    "total_questions": total_questions,
                }
            )
            payload_tests.append(payload)

        return {
            "success": True,
            "data": {
                "tests": payload_tests,
                "class": class_payload,
            },
        }

    def get_test_detail(self, teacher_id: str | None, test_id: int, *, allow_all: bool = False) -> Dict[str, Any]:
        test: Test | None = (
            Test.query.options(joinedload(Test.class_obj))
            .filter(Test.test_id == test_id)
            .first()
        )
        if not test:
            return {"success": False, "error": "Test not found", "status": 404}

        if test.class_id and not allow_all:
            try:
                class_payload = self._ensure_teacher_in_class(teacher_id, test.class_id, allow_all=allow_all)
            except PermissionError:
                return {
                    "success": False,
                    "error": "Teacher does not have permission for this test",
                    "status": 403,
                }
        else:
            class_payload = None

        items: List[Item] = (
            Item.query.options(joinedload(Item.choices))
            .filter(Item.test_id == test.test_id)
            .order_by(Item.item_order_in_part.asc(), Item.item_id.asc())
            .all()
        )

        payload_items: List[Dict[str, Any]] = []
        for idx, item in enumerate(items, start=1):
            payload_items.append(self._serialize_item(item, order=idx))

        return {
            "success": True,
            "data": {
                "test": test.to_dict(),
                "items": payload_items,
                "class": class_payload,
            },
        }

    def create_test_for_teacher(self, teacher_id: str, payload: Dict[str, Any], *, allow_all: bool = False) -> Dict[str, Any]:
        required_fields = ["class_id", "test_name"]
        missing = [field for field in required_fields if not payload.get(field)]
        if missing:
            return {
                "success": False,
                "error": f"Missing required fields: {', '.join(missing)}",
                "status": 400,
            }

        class_id = payload.get("class_id")
        try:
            self._ensure_teacher_in_class(teacher_id, int(class_id), allow_all=allow_all)
        except PermissionError as exc:
            return {
                "success": False,
                "error": str(exc),
                "status": 403,
            }

        items_payload = payload.get("items") or []
        if not isinstance(items_payload, list) or not items_payload:
            return {
                "success": False,
                "error": "At least one question is required",
                "status": 400,
            }

        session = self.db.session
        try:
            available_from = self._parse_datetime(payload.get("available_from"))
            due_at = self._parse_datetime(payload.get("due_at"))

            test = Test(
                test_name=payload.get("test_name"),
                test_description=payload.get("test_description"),
                test_duration_min=payload.get("test_duration_min"),
                test_status=payload.get("test_status") or "DRAFT",
                class_id=class_id,
                teacher_id=teacher_id,
                available_from=available_from,
                due_at=due_at,
                max_attempts=payload.get("max_attempts", 2),
                time_limit_min=payload.get("time_limit_min"),
            )
            session.add(test)
            session.flush()  # Acquire test_id

            group_key = self._group_key(test.test_id)
            created_items = self._persist_items(session, items_payload, group_key, test.test_id)

            test.test_total_questions = len(created_items)
            session.commit()

            test_payload = test.to_dict()
            test_payload["items"] = created_items

            return {
                "success": True,
                "data": test_payload,
            }
        except ValueError as exc:
            session.rollback()
            return {"success": False, "error": str(exc), "status": 400}
        except Exception as exc:  # pragma: no cover - defensive
            session.rollback()
            return {
                "success": False,
                "error": f"Failed to create test: {exc}",
                "status": 500,
            }

    def update_test_for_teacher(self, teacher_id: str, test_id: int, payload: Dict[str, Any], *, allow_all: bool = False) -> Dict[str, Any]:
        test: Test | None = Test.query.filter(Test.test_id == test_id).first()
        if not test:
            return {"success": False, "error": "Test not found", "status": 404}

        if test.class_id and not allow_all:
            try:
                self._ensure_teacher_in_class(teacher_id, test.class_id, allow_all=allow_all)
            except PermissionError as exc:
                return {"success": False, "error": str(exc), "status": 403}

        items_payload = payload.get("items") or []
        if not isinstance(items_payload, list) or not items_payload:
            return {
                "success": False,
                "error": "At least one question is required",
                "status": 400,
            }

        session = self.db.session
        try:
            if "test_name" in payload:
                test.test_name = payload.get("test_name")
            if "test_description" in payload:
                test.test_description = payload.get("test_description")
            if "test_duration_min" in payload:
                test.test_duration_min = payload.get("test_duration_min")
            if "test_status" in payload:
                test.test_status = payload.get("test_status") or test.test_status
            if "class_id" in payload and payload.get("class_id"):
                try:
                    new_class_id = int(payload.get("class_id"))
                    self._ensure_teacher_in_class(teacher_id, new_class_id, allow_all=allow_all)
                    test.class_id = new_class_id
                except (ValueError, PermissionError) as exc:
                    raise ValueError(str(exc)) from exc
            if "available_from" in payload:
                test.available_from = self._parse_datetime(payload.get("available_from"))
            if "due_at" in payload:
                test.due_at = self._parse_datetime(payload.get("due_at"))
            if "max_attempts" in payload:
                test.max_attempts = payload.get("max_attempts")
            if "time_limit_min" in payload:
                test.time_limit_min = payload.get("time_limit_min")

            group_key = self._group_key(test.test_id)
            # Remove existing items/choices
            old_items = Item.query.filter(Item.test_id == test.test_id).all()
            for old_item in old_items:
                Choice.query.filter(Choice.item_id == old_item.item_id).delete()
                session.delete(old_item)
            session.flush()

            created_items = self._persist_items(session, items_payload, group_key, test.test_id)
            test.test_total_questions = len(created_items)

            session.commit()
            test_payload = test.to_dict()
            test_payload["items"] = created_items
            return {
                "success": True,
                "data": test_payload,
            }
        except ValueError as exc:
            session.rollback()
            return {"success": False, "error": str(exc), "status": 400}
        except Exception as exc:  # pragma: no cover - defensive
            session.rollback()
            return {
                "success": False,
                "error": f"Failed to update test: {exc}",
                "status": 500,
            }

    def delete_test_for_teacher(self, teacher_id: str, test_id: int, *, allow_all: bool = False) -> Dict[str, Any]:
        test: Test | None = Test.query.filter(Test.test_id == test_id).first()
        if not test:
            return {"success": False, "error": "Test not found", "status": 404}

        if test.class_id and not allow_all:
            try:
                self._ensure_teacher_in_class(teacher_id, test.class_id, allow_all=allow_all)
            except PermissionError as exc:
                return {"success": False, "error": str(exc), "status": 403}

        session = self.db.session
        try:
            attempt_exists = (
                Attempt.query.filter(Attempt.test_id == test.test_id).first() is not None
            )
            if attempt_exists:
                return {
                    "success": False,
                    "error": "Cannot delete test because attempts exist",
                    "status": 409,
                }

            # Remove items and choices
            items = Item.query.filter(Item.test_id == test.test_id).all()
            for item in items:
                Choice.query.filter(Choice.item_id == item.item_id).delete()
                session.delete(item)

            session.delete(test)
            session.commit()

            return {
                "success": True,
                "data": {"test_id": test_id},
            }
        except Exception as exc:  # pragma: no cover - defensive
            session.rollback()
            return {
                "success": False,
                "error": f"Failed to delete test: {exc}",
                "status": 500,
            }

    def get_test_scoreboard(self, teacher_id: str, test_id: int, *, allow_all: bool = False) -> Dict[str, Any]:
        test: Test | None = Test.query.filter(Test.test_id == test_id).first()
        if not test:
            return {"success": False, "error": "Test not found", "status": 404}

        if test.class_id and not allow_all:
            try:
                class_payload = self._ensure_teacher_in_class(teacher_id, test.class_id, allow_all=allow_all)
            except PermissionError as exc:
                return {"success": False, "error": str(exc), "status": 403}
        else:
            class_payload = None

        total_questions = test.test_total_questions or Item.query.filter(Item.test_id == test_id).count()

        attempts = (
            self.db.session.query(Attempt)
            .options()
            .filter(Attempt.test_id == test_id)
            .order_by(Attempt.att_submitted_at.desc())
            .all()
        )
        if not attempts:
            return {
                "success": True,
                "data": {
                    "scoreboard": [],
                    "test": test.to_dict(),
                    "class": class_payload,
                    "total_questions": total_questions,
                },
            }

        student_ids = {attempt.user_id for attempt in attempts}
        students = Student.query.filter(Student.user_id.in_(student_ids)).all()
        student_map = {student.user_id: student for student in students}

        enrollment_map: Dict[str, Enrollment] = {}
        if test.class_id:
            enrollments = (
                Enrollment.query.options(joinedload(Enrollment.student))
                .filter(Enrollment.class_id == test.class_id, Enrollment.user_id.in_(student_ids))
                .all()
            )
            enrollment_map = {enrollment.user_id: enrollment for enrollment in enrollments}

        scoreboard: Dict[str, Dict[str, Any]] = {}
        for attempt in attempts:
            student_id = attempt.user_id
            bucket = scoreboard.setdefault(
                student_id,
                {
                    "user_id": student_id,
                    "student_name": getattr(student_map.get(student_id), "user_name", None),
                    "attempt_count": 0,
                    "best_score": None,
                    "best_score_10": None,
                    "best_percentage": None,
                    "last_submitted_at": None,
                    "attempts": [],
                },
            )

            parsed = None
            if attempt.att_responses_json:
                try:
                    parsed = json.loads(attempt.att_responses_json)
                except json.JSONDecodeError:
                    parsed = None

            correct = None
            percentage = None
            if parsed:
                correct = parsed.get("correct_count")
                percentage = parsed.get("percentage")
            elif attempt.att_raw_score is not None and total_questions:
                correct = attempt.att_raw_score
                percentage = round((attempt.att_raw_score / total_questions) * 100, 2)

            score10 = None
            if correct is not None and total_questions:
                score10 = round((correct / total_questions) * 10, 2)

            bucket_attempt = {
                "att_id": attempt.att_id,
                "submitted_at": attempt.att_submitted_at.isoformat() if attempt.att_submitted_at else None,
                "raw_score": attempt.att_raw_score,
                "correct": correct,
                "percentage": percentage,
                "score_10": score10,
                "status": attempt.att_status,
            }
            bucket["attempts"].append(bucket_attempt)
            bucket["attempt_count"] += 1

            # Update best stats
            best_score = bucket["best_score"]
            if correct is not None and (best_score is None or correct > best_score):
                bucket["best_score"] = correct
                bucket["best_percentage"] = percentage
                bucket["best_score_10"] = score10

            if attempt.att_submitted_at:
                current_last = bucket["last_submitted_at"]
                if not current_last or attempt.att_submitted_at.isoformat() > current_last:
                    bucket["last_submitted_at"] = attempt.att_submitted_at.isoformat()

        # Include enrollment info
        for student_id, entry in scoreboard.items():
            if student_id in enrollment_map:
                entry["enrollment_status"] = enrollment_map[student_id].status

        rows = sorted(scoreboard.values(), key=lambda row: (row["student_name"] or row["user_id"]))

        return {
            "success": True,
            "data": {
                "scoreboard": rows,
                "test": test.to_dict(),
                "class": class_payload,
                "total_questions": total_questions,
            },
        }

    # ------------------------------------------------------------------
    # Internal item persistence helper
    # ------------------------------------------------------------------
    def _persist_items(self, session, items_payload: List[Dict[str, Any]], group_key: str, test_id: int) -> List[Dict[str, Any]]:
        created_items: List[Dict[str, Any]] = []
        for idx, item_data in enumerate(items_payload, start=1):
            part_id = item_data.get("part_id")
            if not part_id:
                raise ValueError(f"Item {idx}: part_id is required")

            part = Part.query.filter(Part.part_id == part_id).first()
            if not part:
                raise ValueError(f"Item {idx}: part not found")

            try:
                order_raw = item_data.get("order")
                order_in_part = int(order_raw) if order_raw is not None else idx
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Item {idx}: order must be an integer") from exc

            choices_payload = item_data.get("choices") or []
            if not isinstance(choices_payload, list) or not choices_payload:
                raise ValueError(f"Item {idx}: at least one choice is required")

            item = Item(
                part_id=part.part_id,
                test_id=test_id,
                item_group_key=group_key,
                item_stimulus_text=item_data.get("stimulus_text"),
                item_question_text=item_data.get("question_text"),
                item_image_path=item_data.get("image_path"),
                item_audio_path=item_data.get("audio_path"),
                item_order_in_part=order_in_part,
            )
            session.add(item)
            session.flush()

            has_correct = False
            choice_payloads: List[Dict[str, Any]] = []
            for choice_idx, choice_data in enumerate(choices_payload, start=1):
                label = choice_data.get("label")
                content = choice_data.get("content")
                is_correct = bool(choice_data.get("is_correct"))
                if not label or not content:
                    raise ValueError(
                        f"Item {idx}: Choice {choice_idx} must include label and content"
                    )
                if is_correct:
                    has_correct = True

                choice = Choice(
                    item_id=item.item_id,
                    choice_label=label,
                    choice_content=content,
                    choice_is_correct=is_correct,
                )
                session.add(choice)
                session.flush()
                choice_payloads.append(self._serialize_choice(choice))

            if not has_correct:
                raise ValueError(f"Item {idx}: at least one correct choice is required")

            item_payload = self._serialize_item(item, order=idx)
            item_payload["choices"] = choice_payloads
            created_items.append(item_payload)

        return created_items
*** End Patch