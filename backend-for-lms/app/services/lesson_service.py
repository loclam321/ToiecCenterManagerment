from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from sqlalchemy.orm import joinedload
from werkzeug.utils import secure_filename

from app.config import db
from app.models.enrollment_model import Enrollment
from app.models.class_model import Class
from app.models.lesson_model import Lesson
from app.models.learning_path_model import LearningPath
from app.models.part_model import Part
from app.models.item_model import Item
from app.models.choice_model import Choice
from app.models.course_model import Course
from app.models.schedule_model import Schedule


class LessonService:
    """Domain service cung cấp dữ liệu bài học theo lộ trình hàng tuần."""

    def __init__(self, database=None) -> None:
        self.db = database or db

    _VIDEO_PREFIXES = ("/video/", "http://", "https://")
    _IMAGE_PREFIXES = ("/img-test/", "/assets/", "/assets1/", "http://", "https://")
    _AUDIO_PREFIXES = ("/audio/", "/audio-for-test/", "http://", "https://")

    _PROJECT_ROOT = Path(__file__).resolve().parents[3]
    _FRONTEND_PUBLIC = _PROJECT_ROOT / "frontend-for-lms" / "public"
    _MEDIA_DIRECTORIES = {
        "video": ("/video/", _FRONTEND_PUBLIC / "video"),
        "audio": ("/audio-for-test/", _FRONTEND_PUBLIC / "audio-for-test"),
        "image": ("/img-test/", _FRONTEND_PUBLIC / "img-test"),
    }
    _ALLOWED_EXTENSIONS = {
        "video": {".mp4", ".mov", ".webm", ".mkv"},
        "audio": {".mp3", ".wav", ".m4a", ".aac"},
        "image": {".png", ".jpg", ".jpeg", ".gif", ".webp"},
    }

    @staticmethod
    def _normalize_path(path: str | None) -> str | None:
        if path is None:
            return None
        value = str(path).strip()
        return value or None

    @classmethod
    def _validate_media_path(cls, value: str | None, allowed_prefixes: Tuple[str, ...], field_name: str) -> str | None:
        normalized = cls._normalize_path(value)
        if normalized is None:
            return None
        if any(normalized.startswith(prefix) for prefix in allowed_prefixes):
            return normalized
        raise ValueError(f"{field_name} must start with one of: {', '.join(allowed_prefixes)}")

    @staticmethod
    def _parse_date(value: str | None) -> date | None:
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError("available_from must be in YYYY-MM-DD format") from exc

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

    def get_teacher_creation_setup(self, teacher_id: str) -> Dict[str, Any]:
        """Trả về danh sách lớp được phân công cho giáo viên cùng thông tin hỗ trợ tạo bài học."""

        schedules = (
            Schedule.query.options(
                joinedload(Schedule.class_obj)
                .joinedload(Class.course)
                .joinedload(Course.learning_path)
            )
            .filter(Schedule.user_id == teacher_id)
            .all()
        )

        class_map: Dict[int, Dict[str, Any]] = {}
        for schedule in schedules:
            class_obj = schedule.class_obj
            if not class_obj or not class_obj.course:
                continue
            learning_path = getattr(class_obj.course, "learning_path", None)
            class_map.setdefault(
                class_obj.class_id,
                {
                    "class_id": class_obj.class_id,
                    "class_name": class_obj.class_name,
                    "course_id": class_obj.course.course_id,
                    "course_name": class_obj.course.course_name,
                    "learning_path_id": learning_path.lp_id if learning_path else None,
                    "learning_path_name": learning_path.lp_name if learning_path else None,
                },
            )

        parts = [part.to_dict() for part in Part.query.order_by(Part.part_order_in_test.asc()).all()]

        return {
            "success": True,
            "data": {
                "classes": list(class_map.values()),
                "parts": parts,
            },
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

    def get_media_library(self, media_type: str) -> Dict[str, Any]:
        media_type = (media_type or "").lower()
        if media_type not in self._MEDIA_DIRECTORIES:
            return {
                "success": False,
                "error": "Unsupported media type",
                "status": 400,
            }

        prefix, folder = self._MEDIA_DIRECTORIES[media_type]
        try:
            folder.mkdir(parents=True, exist_ok=True)
            files = []
            for entry in sorted(folder.iterdir()):
                if entry.is_file() and not entry.name.startswith("."):
                    files.append({
                        "name": entry.name,
                        "path": f"{prefix}{entry.name}",
                    })
            return {
                "success": True,
                "data": {
                    "files": files,
                },
            }
        except OSError as exc:  # pragma: no cover - filesystem issues
            return {
                "success": False,
                "error": f"Unable to access media directory: {exc}",
                "status": 500,
            }

    def upload_media_file(self, media_type: str, file_storage) -> Dict[str, Any]:
        media_type = (media_type or "").lower()
        if media_type not in self._MEDIA_DIRECTORIES:
            return {
                "success": False,
                "error": "Unsupported media type",
                "status": 400,
            }

        if not file_storage or not getattr(file_storage, "filename", None):
            return {
                "success": False,
                "error": "No file provided",
                "status": 400,
            }

        original_name = secure_filename(file_storage.filename)
        suffix = Path(original_name).suffix.lower()
        allowed_exts = self._ALLOWED_EXTENSIONS.get(media_type, set())
        if suffix not in allowed_exts:
            allowed_list = ", ".join(sorted(allowed_exts))
            return {
                "success": False,
                "error": f"Unsupported file type. Allowed extensions: {allowed_list}",
                "status": 400,
            }

        prefix, folder = self._MEDIA_DIRECTORIES[media_type]
        try:
            folder.mkdir(parents=True, exist_ok=True)
            stored_name = f"{uuid4().hex}{suffix}"
            destination = folder / stored_name
            file_storage.save(destination)

            return {
                "success": True,
                "data": {
                    "path": f"{prefix}{stored_name}",
                    "stored_name": stored_name,
                    "original_name": original_name,
                    "media_type": media_type,
                    "destination": str(destination),
                },
            }
        except OSError as exc:  # pragma: no cover - filesystem issues
            return {
                "success": False,
                "error": f"Unable to save file: {exc}",
                "status": 500,
            }

    def create_lesson_for_teacher(self, teacher_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Tạo bài học mới cho giáo viên và kèm theo item/choice luyện tập."""

        required_fields = ("class_id", "part_id", "lesson_name")
        missing = [field for field in required_fields if not payload.get(field)]
        if missing:
            return {
                "success": False,
                "error": f"Missing required fields: {', '.join(missing)}",
                "status": 400,
            }

        class_id = payload.get("class_id")
        part_id = payload.get("part_id")

        class_obj: Class | None = Class.query.options(
            joinedload(Class.course).joinedload(Course.learning_path)
        ).filter(Class.class_id == class_id).first()

        if not class_obj:
            return {"success": False, "error": "Class not found", "status": 404}

        # Xác thực giáo viên có lịch với lớp này
        schedule_exists = (
            Schedule.query.filter(
                Schedule.class_id == class_id, Schedule.user_id == teacher_id
            ).first()
            is not None
        )

        if not schedule_exists:
            return {
                "success": False,
                "error": "Teacher does not have permission for this class",
                "status": 403,
            }

        course = class_obj.course
        learning_path: LearningPath | None = getattr(course, "learning_path", None)
        if not learning_path:
            return {
                "success": False,
                "error": "Class course does not have an associated learning path",
                "status": 400,
            }

        part: Part | None = Part.query.filter(Part.part_id == part_id).first()
        if not part:
            return {"success": False, "error": "Part not found", "status": 404}

        available_from = self._parse_date(payload.get("available_from"))

        try:
            video_link = self._validate_media_path(
                payload.get("video_link"), self._VIDEO_PREFIXES, "video_link"
            )
            items_payload = payload.get("items") or []
            if not isinstance(items_payload, list):
                raise ValueError("items must be a list")
        except ValueError as exc:
            return {"success": False, "error": str(exc), "status": 400}

        if not items_payload:
            return {
                "success": False,
                "error": "At least one item is required",
                "status": 400,
            }

        session = self.db.session

        try:
            lesson = Lesson(
                lp_id=learning_path.lp_id,
                part_id=part.part_id,
                ls_name=payload.get("lesson_name"),
                ls_link=video_link,
                ls_date=available_from,
            )
            session.add(lesson)
            session.flush()  # Lấy ls_id

            group_key = self._lesson_group_key(lesson.ls_id)

            created_items: List[Dict[str, Any]] = []
            for idx, item_data in enumerate(items_payload, start=1):
                try:
                    stimulus_text = item_data.get("stimulus_text")
                    question_text = item_data.get("question_text")
                    image_path = self._validate_media_path(
                        item_data.get("image_path"),
                        self._IMAGE_PREFIXES,
                        "item.image_path",
                    )
                    audio_path = self._validate_media_path(
                        item_data.get("audio_path"),
                        self._AUDIO_PREFIXES,
                        "item.audio_path",
                    )
                    choices_payload = item_data.get("choices") or []
                    if not isinstance(choices_payload, list) or not choices_payload:
                        raise ValueError("Each item must include choices")
                except ValueError as exc:
                    raise ValueError(f"Item {idx}: {exc}") from exc

                order_raw = item_data.get("order")
                try:
                    order_in_part = int(order_raw) if order_raw is not None else idx
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Item {idx}: order must be an integer") from exc

                item = Item(
                    part_id=part.part_id,
                    test_id=item_data.get("test_id"),
                    item_group_key=group_key,
                    item_stimulus_text=stimulus_text,
                    item_question_text=question_text,
                    item_image_path=image_path,
                    item_audio_path=audio_path,
                    item_order_in_part=order_in_part,
                )
                session.add(item)
                session.flush()

                created_choices: List[Dict[str, Any]] = []
                has_correct_choice = False
                for choice_idx, choice_data in enumerate(choices_payload, start=1):
                    label = choice_data.get("label")
                    content = choice_data.get("content")
                    is_correct = bool(choice_data.get("is_correct"))
                    if not label or not content:
                        raise ValueError(
                            f"Item {idx}: Choice {choice_idx} must include label and content"
                        )
                    if is_correct:
                        has_correct_choice = True
                    choice = Choice(
                        item_id=item.item_id,
                        choice_label=label,
                        choice_content=content,
                        choice_is_correct=is_correct,
                    )
                    session.add(choice)
                    session.flush()
                    created_choices.append(choice.to_dict())

                if not has_correct_choice:
                    raise ValueError(f"Item {idx} must have at least one correct choice")

                created_items.append(
                    {
                        "item": item.to_dict(),
                        "choices": created_choices,
                    }
                )

            session.commit()

            lesson_payload = lesson.to_dict()
            item_payloads: List[Dict[str, Any]] = []
            for bundle in created_items:
                item_payload = bundle["item"]
                item_payload["choices"] = bundle["choices"]
                item_payloads.append(item_payload)

            return {
                "success": True,
                "data": {
                    "lesson": lesson_payload,
                    "items": item_payloads,
                },
            }
        except ValueError as exc:
            session.rollback()
            return {"success": False, "error": str(exc), "status": 400}
        except Exception as exc:  # pragma: no cover - defensive
            session.rollback()
            return {
                "success": False,
                "error": f"Failed to create lesson: {exc}",
                "status": 500,
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

    def get_teacher_lesson_history(self, teacher_id: str, class_id: int) -> Dict[str, Any]:
        """Lấy danh sách bài học theo class_id cho giáo viên."""
        
        # Xác thực giáo viên có lịch với lớp này
        schedule_exists = (
            Schedule.query.filter(
                Schedule.class_id == class_id, Schedule.user_id == teacher_id
            ).first()
            is not None
        )

        if not schedule_exists:
            return {
                "success": False,
                "error": "Teacher does not have permission for this class",
                "status": 403,
            }

        class_obj: Class | None = Class.query.options(
            joinedload(Class.course).joinedload(Course.learning_path)
        ).filter(Class.class_id == class_id).first()

        if not class_obj or not class_obj.course:
            return {"success": False, "error": "Class not found", "status": 404}

        learning_path: LearningPath | None = getattr(class_obj.course, "learning_path", None)
        if not learning_path:
            return {
                "success": False,
                "error": "Class does not have learning path",
                "status": 404,
            }

        lessons = (
            Lesson.query.options(joinedload(Lesson.part))
            .filter(Lesson.lp_id == learning_path.lp_id)
            .order_by(Lesson.ls_date.asc(), Lesson.ls_id.desc())
            .all()
        )

        lessons_payload: List[Dict[str, Any]] = []
        for lesson in lessons:
            part = lesson.part
            group_key = self._lesson_group_key(lesson.ls_id)
            item_count = (
                Item.query.filter(Item.item_group_key == group_key)
                .with_entities(Item.item_id)
                .count()
            )

            lessons_payload.append({
                "lesson_id": lesson.ls_id,
                "lesson_name": lesson.ls_name,
                "available_from": lesson.ls_date.isoformat() if lesson.ls_date else None,
                "video_link": lesson.ls_link,
                "item_count": item_count,
                "part": {
                    "part_id": part.part_id if part else None,
                    "part_code": part.part_code if part else None,
                    "part_name": part.part_name if part else None,
                    "part_section": part.part_section if part else None,
                },
            })

        return {
            "success": True,
            "data": {
                "lessons": lessons_payload,
                "class": {
                    "class_id": class_obj.class_id,
                    "class_name": class_obj.class_name,
                    "course_id": class_obj.course.course_id,
                    "course_name": class_obj.course.course_name,
                },
            },
        }

    def get_teacher_lesson_detail(self, teacher_id: str, lesson_id: int) -> Dict[str, Any]:
        """Lấy chi tiết bài học kèm items và choices cho giáo viên."""
        
        lesson: Lesson | None = (
            Lesson.query.options(joinedload(Lesson.part), joinedload(Lesson.learning_path))
            .filter(Lesson.ls_id == lesson_id)
            .first()
        )
        if not lesson:
            return {"success": False, "error": "Lesson not found", "status": 404}

        learning_path = lesson.learning_path
        if not learning_path:
            return {
                "success": False,
                "error": "Lesson does not have learning path",
                "status": 404,
            }

        # Tìm class_id thông qua course_id
        target_course_id = getattr(learning_path, "course_id", None)
        class_obj = None
        if target_course_id:
            class_obj = Class.query.filter(Class.course_id == target_course_id).first()

        # Xác thực giáo viên có quyền
        if class_obj:
            schedule_exists = (
                Schedule.query.filter(
                    Schedule.class_id == class_obj.class_id,
                    Schedule.user_id == teacher_id
                ).first()
                is not None
            )
            if not schedule_exists:
                return {
                    "success": False,
                    "error": "Teacher does not have permission for this lesson",
                    "status": 403,
                }

        group_key = self._lesson_group_key(lesson.ls_id)
        items: List[Item] = (
            Item.query.options(joinedload(Item.choices))
            .filter(Item.item_group_key == group_key)
            .order_by(Item.item_order_in_part.asc(), Item.item_id.asc())
            .all()
        )

        items_payload: List[Dict[str, Any]] = []
        for idx, item in enumerate(items, start=1):
            items_payload.append({
                "item_id": item.item_id,
                "order": idx,
                "stimulus_text": item.item_stimulus_text,
                "question_text": item.item_question_text,
                "image_path": item.item_image_path,
                "audio_path": item.item_audio_path,
                "choices": [
                    {
                        "choice_id": choice.choice_id,
                        "label": choice.choice_label,
                        "content": choice.choice_content,
                        "is_correct": choice.choice_is_correct,
                    }
                    for choice in sorted(item.choices, key=lambda c: c.choice_label)
                ],
            })

        part = lesson.part
        return {
            "success": True,
            "data": {
                "lesson": {
                    "lesson_id": lesson.ls_id,
                    "lesson_name": lesson.ls_name,
                    "available_from": lesson.ls_date.isoformat() if lesson.ls_date else None,
                    "video_link": lesson.ls_link,
                    "part_id": part.part_id if part else None,
                    "lp_id": lesson.lp_id,
                },
                "part": {
                    "part_id": part.part_id if part else None,
                    "part_code": part.part_code if part else None,
                    "part_name": part.part_name if part else None,
                    "part_section": part.part_section if part else None,
                },
                "items": items_payload,
            },
        }

    def update_lesson_for_teacher(
        self, teacher_id: str, lesson_id: int, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Cập nhật bài học và items/choices cho giáo viên."""
        
        lesson: Lesson | None = (
            Lesson.query.options(joinedload(Lesson.learning_path))
            .filter(Lesson.ls_id == lesson_id)
            .first()
        )
        if not lesson:
            return {"success": False, "error": "Lesson not found", "status": 404}

        learning_path = lesson.learning_path
        if not learning_path:
            return {
                "success": False,
                "error": "Lesson does not have learning path",
                "status": 404,
            }

        target_course_id = getattr(learning_path, "course_id", None)
        class_obj = None
        if target_course_id:
            class_obj = Class.query.filter(Class.course_id == target_course_id).first()

        if class_obj:
            schedule_exists = (
                Schedule.query.filter(
                    Schedule.class_id == class_obj.class_id,
                    Schedule.user_id == teacher_id
                ).first()
                is not None
            )
            if not schedule_exists:
                return {
                    "success": False,
                    "error": "Teacher does not have permission to update this lesson",
                    "status": 403,
                }

        session = self.db.session

        try:
            # Cập nhật thông tin bài học
            if "lesson_name" in payload:
                lesson.ls_name = payload["lesson_name"]
            if "available_from" in payload:
                lesson.ls_date = self._parse_date(payload.get("available_from"))
            if "video_link" in payload:
                lesson.ls_link = self._validate_media_path(
                    payload.get("video_link"), self._VIDEO_PREFIXES, "video_link"
                )

            # Xóa tất cả items và choices cũ
            group_key = self._lesson_group_key(lesson.ls_id)
            old_items = Item.query.filter(Item.item_group_key == group_key).all()
            for old_item in old_items:
                Choice.query.filter(Choice.item_id == old_item.item_id).delete()
                session.delete(old_item)

            # Thêm items và choices mới
            items_payload = payload.get("items") or []
            if not isinstance(items_payload, list):
                raise ValueError("items must be a list")

            if not items_payload:
                raise ValueError("At least one item is required")

            created_items: List[Dict[str, Any]] = []
            for idx, item_data in enumerate(items_payload, start=1):
                try:
                    stimulus_text = item_data.get("stimulus_text")
                    question_text = item_data.get("question_text")
                    image_path = self._validate_media_path(
                        item_data.get("image_path"),
                        self._IMAGE_PREFIXES,
                        "item.image_path",
                    )
                    audio_path = self._validate_media_path(
                        item_data.get("audio_path"),
                        self._AUDIO_PREFIXES,
                        "item.audio_path",
                    )
                    choices_payload = item_data.get("choices") or []
                    if not isinstance(choices_payload, list) or not choices_payload:
                        raise ValueError("Each item must include choices")
                except ValueError as exc:
                    raise ValueError(f"Item {idx}: {exc}") from exc

                order_raw = item_data.get("order")
                try:
                    order_in_part = int(order_raw) if order_raw is not None else idx
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Item {idx}: order must be an integer") from exc

                item = Item(
                    part_id=lesson.part_id,
                    test_id=item_data.get("test_id"),
                    item_group_key=group_key,
                    item_stimulus_text=stimulus_text,
                    item_question_text=question_text,
                    item_image_path=image_path,
                    item_audio_path=audio_path,
                    item_order_in_part=order_in_part,
                )
                session.add(item)
                session.flush()

                created_choices: List[Dict[str, Any]] = []
                has_correct_choice = False
                for choice_idx, choice_data in enumerate(choices_payload, start=1):
                    label = choice_data.get("label")
                    content = choice_data.get("content")
                    is_correct = bool(choice_data.get("is_correct"))
                    if not label or not content:
                        raise ValueError(
                            f"Item {idx}: Choice {choice_idx} must include label and content"
                        )
                    if is_correct:
                        has_correct_choice = True
                    choice = Choice(
                        item_id=item.item_id,
                        choice_label=label,
                        choice_content=content,
                        choice_is_correct=is_correct,
                    )
                    session.add(choice)
                    session.flush()
                    created_choices.append(choice.to_dict())

                if not has_correct_choice:
                    raise ValueError(f"Item {idx} must have at least one correct choice")

                created_items.append({
                    "item": item.to_dict(),
                    "choices": created_choices,
                })

            session.commit()

            lesson_payload = lesson.to_dict()
            item_payloads: List[Dict[str, Any]] = []
            for bundle in created_items:
                item_payload = bundle["item"]
                item_payload["choices"] = bundle["choices"]
                item_payloads.append(item_payload)

            return {
                "success": True,
                "data": {
                    "lesson": lesson_payload,
                    "items": item_payloads,
                },
            }
        except ValueError as exc:
            session.rollback()
            return {"success": False, "error": str(exc), "status": 400}
        except Exception as exc:
            session.rollback()
            return {
                "success": False,
                "error": f"Failed to update lesson: {exc}",
                "status": 500,
            }

    def delete_lesson_for_teacher(self, teacher_id: str, lesson_id: int) -> Dict[str, Any]:
        """Xóa bài học và tất cả items/choices liên quan cho giáo viên."""
        
        lesson: Lesson | None = (
            Lesson.query.options(joinedload(Lesson.learning_path))
            .filter(Lesson.ls_id == lesson_id)
            .first()
        )
        if not lesson:
            return {"success": False, "error": "Lesson not found", "status": 404}

        learning_path = lesson.learning_path
        if not learning_path:
            return {
                "success": False,
                "error": "Lesson does not have learning path",
                "status": 404,
            }

        target_course_id = getattr(learning_path, "course_id", None)
        class_obj = None
        if target_course_id:
            class_obj = Class.query.filter(Class.course_id == target_course_id).first()

        if class_obj:
            schedule_exists = (
                Schedule.query.filter(
                    Schedule.class_id == class_obj.class_id,
                    Schedule.user_id == teacher_id
                ).first()
                is not None
            )
            if not schedule_exists:
                return {
                    "success": False,
                    "error": "Teacher does not have permission to delete this lesson",
                    "status": 403,
                }

        session = self.db.session

        try:
            # Xóa tất cả items và choices
            group_key = self._lesson_group_key(lesson.ls_id)
            items = Item.query.filter(Item.item_group_key == group_key).all()
            for item in items:
                Choice.query.filter(Choice.item_id == item.item_id).delete()
                session.delete(item)

            # Xóa bài học
            session.delete(lesson)
            session.commit()

            return {
                "success": True,
                "data": {
                    "lesson_id": lesson_id,
                    "message": "Lesson deleted successfully",
                },
            }
        except Exception as exc:
            session.rollback()
            return {
                "success": False,
                "error": f"Failed to delete lesson: {exc}",
                "status": 500,
            }

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
