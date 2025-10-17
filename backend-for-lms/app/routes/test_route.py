from datetime import timezone, timedelta

from flask import Blueprint, request, jsonify
from app.models.test_model import Test
from app.models.item_model import Item
from app.models.part_model import Part
from app.models.choice_model import Choice
from app.models.attempt_model import Attempt
from app.models.enrollment_model import Enrollment
from app.utils.response_utils import success_response, error_response, not_found_response
from app.config import db
from sqlalchemy import func
import datetime

test_bp = Blueprint("tests", __name__, url_prefix="/api/tests")


LOCAL_TIMEZONE = timezone(timedelta(hours=7))


def _as_utc(dt_value):
    if not dt_value:
        return None
    if dt_value.tzinfo is None:
        localized = dt_value.replace(tzinfo=LOCAL_TIMEZONE)
    else:
        localized = dt_value
    return localized.astimezone(timezone.utc)


def _check_test_window(test_obj):
    now = datetime.datetime.now(timezone.utc)
    available_from = _as_utc(test_obj.available_from)
    due_at = _as_utc(test_obj.due_at)

    if available_from and available_from > now:
        return False, "Bài kiểm tra chưa mở"
    if due_at and due_at < now:
        return False, "Bài kiểm tra đã đóng"

    status = (test_obj.test_status or '').upper()
    if status in {"INACTIVE", "ARCHIVED"}:
        return False, "Bài kiểm tra không khả dụng"

    return True, None


@test_bp.route("/<int:test_id>", methods=["GET"])
def get_test_meta(test_id):
    """Lấy thông tin meta của test"""
    try:
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)

        is_open, message = _check_test_window(test)
        if not is_open:
            return error_response(message, 403)
        
        return success_response(test.to_dict())
    except Exception as e:
        return error_response(f"Error retrieving test: {str(e)}", 500)


@test_bp.route("/<int:test_id>/check-eligibility", methods=["GET", "OPTIONS"])
def check_test_eligibility(test_id):
    """Kiểm tra xem user có thể làm bài test này không (giới hạn 2 lần)"""
    # Handle OPTIONS preflight request
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)

        is_open, message = _check_test_window(test)
        if not is_open:
            return error_response(message, 403)
        
        user_id = request.args.get("user_id")
        if not user_id:
            return error_response("Missing user_id parameter", 400)
        
        # Đếm số lần đã làm
        attempt_count = Attempt.query.filter(
            Attempt.user_id == user_id,
            Attempt.test_id == test_id,
            Attempt.att_status == "COMPLETED"
        ).count()
        
        # Giới hạn tối đa 2 lần
        max_attempts = 2
        can_attempt = attempt_count < max_attempts
        remaining_attempts = max(0, max_attempts - attempt_count)
        
        return success_response({
            "can_attempt": can_attempt,
            "attempt_count": attempt_count,
            "max_attempts": max_attempts,
            "remaining_attempts": remaining_attempts,
            "message": f"Bạn đã làm {attempt_count}/{max_attempts} lần" if not can_attempt 
                      else f"Bạn còn {remaining_attempts} lần làm bài"
        })
    except Exception as e:
        return error_response(f"Error checking eligibility: {str(e)}", 500)


@test_bp.route("/<int:test_id>/questions", methods=["GET"])
def get_test_questions(test_id):
    """Lấy danh sách câu hỏi của test"""
    try:
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)

        is_open, message = _check_test_window(test)
        if not is_open:
            return error_response(message, 403)
        
        # Lấy các items (questions) cho test này
        items = (
            db.session.query(Item)
            .join(Part, Item.part_id == Part.part_id)
            .filter(Item.test_id == test_id)
            .order_by(Part.part_order_in_test, Item.item_order_in_part)
            .all()
        )
        
        questions = []
        for idx, item in enumerate(items):
            # Lấy choices cho mỗi item
            choices = db.session.query(Choice).filter(
                Choice.item_id == item.item_id
            ).all()
            
            question = {
                "order": idx + 1,
                "qs_index": item.item_id,  # Map to frontend naming
                "qs_desciption": item.item_question_text or "",  # Map to frontend naming
                "item_stimulus_text": item.item_stimulus_text,
                "item_image_path": item.item_image_path,
                "item_audio_path": item.item_audio_path,
                # Part metadata for UI grouping and display
                "part_id": item.part_id,
                "part_order": item.part.part_order_in_test if item.part else None,
                "part_code": item.part.part_code if item.part else None,
                "part_name": item.part.part_name if item.part else None,
                "part_section": item.part.part_section if item.part else None,
                "answers": [
                    {
                        "as_index": choice.choice_id,  # Map to frontend naming
                        "as_content": choice.choice_content,  # Map to frontend naming
                        "choice_label": (choice.choice_label or '').strip() or chr(65 + i)
                    }
                    for i, choice in enumerate(choices)
                ]
            }
            questions.append(question)
        
        return success_response(questions)
    except Exception as e:
        return error_response(f"Error retrieving test questions: {str(e)}", 500)


@test_bp.route("/<int:test_id>/submit", methods=["POST"])
def submit_test(test_id):
    """Nộp bài kiểm tra"""
    try:
        import json
        
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)

        is_open, message = _check_test_window(test)
        if not is_open:
            return error_response(message, 403)
        
        payload = request.get_json() or {}
        user_id = payload.get("user_id")
        class_id = payload.get("class_id")
        responses = payload.get("responses", [])
        
        # ====== KIỂM TRA GIỚI HẠN SỐ LẦN LÀM BÀI (MAX 2 LẦN) ======
        if user_id:
            existing_attempts = Attempt.query.filter(
                Attempt.user_id == user_id,
                Attempt.test_id == test_id,
                Attempt.att_status == "COMPLETED"
            ).count()
            
            max_attempts = 2
            if existing_attempts >= max_attempts:
                return error_response(
                    f"Bạn đã làm đủ {max_attempts} lần cho bài kiểm tra này. Không thể làm thêm.",
                    403
                )
        
        # Tính điểm và lưu chi tiết từng câu
        total_correct = 0
        total_questions = len(responses)
        detailed_responses = []
        
        for idx, response in enumerate(responses):
            qs_index = response.get("qs_index")  # This is actually item_id
            as_index = response.get("as_index")  # This is actually choice_id
            
            # Lấy thông tin item
            item = Item.query.get(qs_index)
            
            # Kiểm tra xem câu trả lời có đúng không
            choice = Choice.query.filter(
                Choice.choice_id == as_index,
                Choice.item_id == qs_index
            ).first()
            
            is_correct = choice and choice.choice_is_correct
            if is_correct:
                total_correct += 1
            
            # Lưu chi tiết câu trả lời
            detailed_responses.append({
                "question_number": idx + 1,
                "item_id": qs_index,
                "selected_choice_id": as_index,
                "is_correct": is_correct,
                "part_id": item.part_id if item else None,
                "part_name": item.part.part_name if (item and item.part) else None
            })
        
        # Tính điểm
        score_ratio = total_correct / total_questions if total_questions > 0 else 0
        final_score = total_correct
        percentage = round(score_ratio * 100, 2)
        passed = score_ratio >= 0.5
        low_threshold_ratio = 0.3
        low_score_warning = score_ratio < low_threshold_ratio
        
        # Tạo JSON data để lưu vào att_responses_json
        responses_data = {
            "total_questions": total_questions,
            "correct_count": total_correct,
            "percentage": percentage,
            "responses": detailed_responses
        }
        
        # Lưu attempt vào database (nếu có user)
        current_attempt_id = None
        if user_id:
            # Nếu không có class_id, dùng class_id = 1 làm mặc định
            if class_id is None:
                class_id = 1
                print(f"[INFO] No class_id provided, using default class_id = 1")
            
            json_str = json.dumps(responses_data, ensure_ascii=False)
            json_length = len(json_str)
            
            print(f"\n{'='*60}")
            print(f"[INFO] Saving attempt for user {user_id}, test {test_id}")
            print(f"[INFO] Class ID: {class_id}")
            print(f"[INFO] JSON data length: {json_length} characters")
            print(f"[INFO] Score: {final_score}/{total_questions} ({percentage}%)")
            
            if json_length > 2048:
                print(f"[WARNING] JSON length ({json_length}) exceeds VARCHAR(2048) limit!")
                print(f"[WARNING] Data may be truncated!")
                print(f"[WARNING] Consider reducing response data or increasing field size")
            elif json_length > 100:
                print(f"[OK] JSON size is within VARCHAR(2048) limit")
            
            try:
                attempt = Attempt(
                    user_id=user_id,
                    test_id=test_id,
                    class_id=class_id,  # Always has value now (default = 1)
                    att_started_at=datetime.datetime.now(),
                    att_submitted_at=datetime.datetime.now(),
                    att_raw_score=final_score,
                    att_status="COMPLETED",
                    att_responses_json=json_str
                )
                db.session.add(attempt)
                db.session.commit()
                current_attempt_id = attempt.att_id
                
                print(f"[SUCCESS] Attempt saved with ID: {current_attempt_id}")
                print(f"{'='*60}\n")
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to save attempt: {str(e)}")
                print(f"{'='*60}\n")
                raise
        
        # Lấy lịch sử làm bài và điểm cao nhất của user cho test này
        attempts_list = []
        best_score = None
        if user_id:
            user_attempts = (
                Attempt.query
                .filter(Attempt.user_id == user_id, Attempt.test_id == test_id)
                .order_by(Attempt.att_submitted_at.desc())
                .all()
            )
            # Parse JSON data for each attempt
            for a in user_attempts:
                attempt_dict = a.to_dict()
                
                # Try to parse JSON if exists
                if a.att_responses_json:
                    try:
                        parsed_data = json.loads(a.att_responses_json)
                        attempt_dict["att_correct_count"] = parsed_data.get("correct_count")
                        attempt_dict["att_total_questions"] = parsed_data.get("total_questions")
                        attempt_dict["att_percentage"] = parsed_data.get("percentage")
                    except Exception as e:
                        # JSON parsing failed (probably truncated data from VARCHAR(10))
                        print(f"[WARNING] Failed to parse JSON for attempt {a.att_id}: {str(e)}")
                        # Fall back to calculating from raw score (if we know total questions)
                        if total_questions > 0:
                            attempt_dict["att_correct_count"] = a.att_raw_score
                            attempt_dict["att_total_questions"] = total_questions
                            attempt_dict["att_percentage"] = round((a.att_raw_score / total_questions) * 100, 2) if a.att_raw_score else 0
                else:
                    # No JSON data (old records or NULL)
                    # Calculate based on raw score
                    if a.att_raw_score is not None and total_questions > 0:
                        attempt_dict["att_correct_count"] = a.att_raw_score
                        attempt_dict["att_total_questions"] = total_questions
                        attempt_dict["att_percentage"] = round((a.att_raw_score / total_questions) * 100, 2)
                
                attempts_list.append(attempt_dict)
            
            if user_attempts:
                best_score = max((a.att_raw_score or 0) for a in user_attempts)
        
        result = {
            "sc_score": final_score,
            "passed": passed,
            "breakdown": {
                "correct": total_correct,
                "total": total_questions,
                "percentage": percentage
            },
            # Lịch sử làm bài & điểm cao nhất
            "attempts": attempts_list,
            "best_score": best_score,
            "current_attempt_id": current_attempt_id,
            # Chi tiết câu trả lời của lần làm bài hiện tại
            "detailed_responses": detailed_responses,
            # Cảnh báo điểm thấp
            "low_score_warning": low_score_warning,
            "low_score_threshold_percent": int(low_threshold_ratio * 100)
        }
        
        return success_response(result)
        
    except Exception as e:
        return error_response(f"Error submitting test: {str(e)}", 500)


@test_bp.route("", methods=["GET"])
def list_tests():
    """Lấy danh sách tất cả tests"""
    try:
        tests = Test.query.all()
        visible_tests = []
        for test in tests:
            is_open, _ = _check_test_window(test)
            if is_open:
                visible_tests.append(test.to_dict())
        return success_response(visible_tests)
    except Exception as e:
        return error_response(f"Error retrieving tests: {str(e)}", 500)


@test_bp.route("/<int:test_id>/attempts", methods=["GET"])
def list_attempts_for_test(test_id):
    """Lấy lịch sử làm bài cho một user và test: /api/tests/<id>/attempts?user_id=..."""
    try:
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)

        user_id = request.args.get("user_id")
        if not user_id:
            return error_response("Missing user_id", 400)

        attempts = (
            Attempt.query
            .filter(Attempt.user_id == user_id, Attempt.test_id == test_id)
            .order_by(Attempt.att_submitted_at.desc())
            .all()
        )
        
        # Tính điểm cao nhất trên thang 10
        best_score_raw = max((a.att_raw_score or 0) for a in attempts) if attempts else None
        best_score_10 = None
        
        if best_score_raw is not None and best_score_raw > 0:
            # Lấy tổng số câu hỏi của test
            total_questions = Item.query.filter(Item.test_id == test_id).count()
            if total_questions > 0:
                best_score_10 = round((best_score_raw / total_questions) * 10, 2)
        
        return success_response({
            "attempts": [a.to_dict() for a in attempts],
            "best_score": best_score_raw,  # Raw score (số câu đúng) - để backward compatible
            "best_score_10": best_score_10,  # Điểm thang 10
            "count": len(attempts),
            "last_submitted_at": attempts[0].att_submitted_at.isoformat() if attempts else None,
        })
    except Exception as e:
        return error_response(f"Error retrieving attempts: {str(e)}", 500)


@test_bp.route("/class/<int:class_id>/student-results", methods=["GET"])
def get_student_test_results_for_class(class_id):
    """
    Lấy kết quả bài kiểm tra của học viên trong lớp
    Query params: user_id (required)
    Returns: Danh sách tests với điểm cao nhất và số người đã làm
    """
    try:
        import json
        from app.models.class_model import Class
        from app.models.enrollment_model import Enrollment
        
        user_id = request.args.get("user_id")
        if not user_id:
            return error_response("Missing user_id parameter", 400)
        
        # Kiểm tra class tồn tại
        class_obj = Class.query.get(class_id)
        if not class_obj:
            return not_found_response("Class not found", "Class", class_id)
        
        # Kiểm tra user có trong lớp không
        enrollment = Enrollment.query.filter_by(
            user_id=user_id,
            class_id=class_id
        ).first()
        
        if not enrollment:
            return error_response("Student not enrolled in this class", 403)
        
        # Lấy tất cả tests trong hệ thống (có thể filter theo course nếu cần)
        tests = Test.query.all()
        
        results = []
        for test in tests:
            # Lấy điểm cao nhất của học viên này
            student_best = (
                db.session.query(func.max(Attempt.att_raw_score))
                .filter(Attempt.user_id == user_id, Attempt.test_id == test.test_id)
                .scalar()
            )
            
            # Đếm số lần làm bài của học viên
            student_attempt_count = (
                Attempt.query
                .filter(Attempt.user_id == user_id, Attempt.test_id == test.test_id)
                .count()
            )
            
            # Đếm tổng số học viên trong lớp đã làm bài test này
            total_participants = (
                db.session.query(func.count(func.distinct(Attempt.user_id)))
                .join(Enrollment, Enrollment.user_id == Attempt.user_id)
                .filter(
                    Enrollment.class_id == class_id,
                    Attempt.test_id == test.test_id
                )
                .scalar()
            ) or 0
            
            # Tính điểm thang 10 nếu có điểm
            score_10 = None
            percentage = None
            if student_best is not None:
                # Lấy tổng số câu hỏi trong test
                total_questions = (
                    Item.query.filter(Item.test_id == test.test_id).count()
                )
                if total_questions > 0:
                    percentage = round((student_best / total_questions) * 100, 2)
                    score_10 = round((student_best / total_questions) * 10, 2)
            
            test_dict = test.to_dict()
            test_dict.update({
                "student_best_score": student_best,  # Số câu đúng
                "student_score_10": score_10,  # Điểm thang 10
                "student_percentage": percentage,  # Tỷ lệ %
                "student_attempt_count": student_attempt_count,  # Số lần làm
                "class_total_participants": total_participants,  # Số người trong lớp đã làm
                "has_attempted": student_attempt_count > 0,  # Đã làm chưa
            })
            results.append(test_dict)
        
        # Sắp xếp: tests đã làm lên đầu, sau đó theo tên
        results.sort(key=lambda x: (not x["has_attempted"], x.get("test_name", "")))
        
        return success_response({
            "tests": results,
            "total_tests": len(results),
            "student_info": {
                "user_id": user_id,
                "class_id": class_id,
                "class_name": class_obj.class_name
            }
        })
        
    except Exception as e:
        return error_response(f"Error retrieving test results: {str(e)}", 500)