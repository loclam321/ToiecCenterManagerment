from flask import Blueprint, request, jsonify
from app.models.test_model import Test
from app.models.item_model import Item
from app.models.choice_model import Choice
from app.models.attempt_model import Attempt
from app.utils.response_helper import success_response, error_response, not_found_response
from app.config import db
from sqlalchemy import func
import datetime

test_bp = Blueprint("tests", __name__, url_prefix="/api/tests")


@test_bp.route("/<int:test_id>", methods=["GET"])
def get_test_meta(test_id):
    """Lấy thông tin meta của test"""
    try:
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)
        
        return success_response(test.to_dict())
    except Exception as e:
        return error_response(f"Error retrieving test: {str(e)}", 500)


@test_bp.route("/<int:test_id>/questions", methods=["GET"])
def get_test_questions(test_id):
    """Lấy danh sách câu hỏi của test"""
    try:
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)
        
        # Lấy các items (questions) cho test này
        items = db.session.query(Item).filter(
            Item.test_id == test_id
        ).order_by(Item.item_order_in_part).all()
        
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
        test = Test.query.get(test_id)
        if not test:
            return not_found_response("Test not found", "Test", test_id)
        
        payload = request.get_json() or {}
        user_id = payload.get("user_id")
        class_id = payload.get("class_id")
        responses = payload.get("responses", [])
        
        # Tính điểm
        total_correct = 0
        total_questions = len(responses)
        
        for response in responses:
            qs_index = response.get("qs_index")  # This is actually item_id
            as_index = response.get("as_index")  # This is actually choice_id
            
            # Kiểm tra xem câu trả lời có đúng không
            choice = Choice.query.filter(
                Choice.choice_id == as_index,
                Choice.item_id == qs_index
            ).first()
            
            if choice and choice.choice_is_correct:
                total_correct += 1
        
        # Tính điểm (không dùng các field không tồn tại trong model)
        score_ratio = total_correct / total_questions if total_questions > 0 else 0
        # Để đơn giản, lấy điểm thô = số câu đúng. Frontend sẽ hiển thị breakdown.
        final_score = total_correct
        # Ngưỡng qua bài mặc định: 50% (có thể điều chỉnh sau)
        passed = score_ratio >= 0.5
        
        # Lưu attempt vào database (nếu có user)
        if user_id:
            attempt = Attempt(
                user_id=user_id,
                test_id=test_id,
                class_id=class_id or 1,  # Default class_id if not provided
                att_started_at=datetime.datetime.now(),
                att_submitted_at=datetime.datetime.now(),
                att_raw_score=final_score,
                att_status="COMPLETED"
            )
            db.session.add(attempt)
            db.session.commit()
        
        result = {
            "sc_score": final_score,
            "passed": passed,
            "breakdown": {
                "correct": total_correct,
                "total": total_questions,
                "percentage": round(score_ratio * 100, 2)
            }
        }
        
        return success_response(result)
        
    except Exception as e:
        return error_response(f"Error submitting test: {str(e)}", 500)


@test_bp.route("", methods=["GET"])
def list_tests():
    """Lấy danh sách tất cả tests"""
    try:
        # Model hiện tại test_status là DateTime, tránh lọc gây sai kiểu → trả tất cả test
        tests = Test.query.all()
        return success_response([test.to_dict() for test in tests])
    except Exception as e:
        return error_response(f"Error retrieving tests: {str(e)}", 500)