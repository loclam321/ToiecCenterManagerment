from enum import verify
from typing import Dict, Any
from datetime import datetime, date
from flask import current_app
from sqlalchemy.exc import IntegrityError

from app.config import db
from app.models.consult_registration_model import ConsultRegistration
from app.models.course_model import Course
from app.utils.email_utils import send_email, generate_email_verification_token


class ConsultRegistrationService:
    def __init__(self):
        self.db = db

    def create_consultation_registration(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Validate required fields
            required_fields = ["course_id"]
            for field in required_fields:
                if field not in data or not data[field]:
                    return {
                        "success": False,
                        "error": f"Missing required field: {field}",
                    }

            # Kiểm tra course tồn tại
            course = Course.query.get(data["course_id"])
            if not course:
                return {
                    "success": False, 
                    "error": "Course not found"
                }

            # Kiểm tra course có đang OPEN không
            if course.status not in ["OPEN", "DRAFT"]:
                return {
                    "success": False,
                    "error": f"Course is not available for registration (status: {course.status})",
                }

            # Validate optional fields
            if data.get("cr_gender"):
                try:
                    ConsultRegistration.validate_gender(data["cr_gender"])
                except ValueError as e:
                    return {"success": False, "error": str(e)}

            if data.get("cr_email"):
                try:
                    ConsultRegistration.validate_email(data["cr_email"])
                except ValueError as e:
                    return {"success": False, "error": str(e)}

            if data.get("cr_phone"):
                try:
                    ConsultRegistration.validate_phone(data["cr_phone"])
                except ValueError as e:
                    return {"success": False, "error": str(e)}

            # Process birthday if provided
            birthday = None
            if "cr_birthday" in data and data["cr_birthday"]:
                try:
                    if isinstance(data["cr_birthday"], str):
                        birthday = datetime.strptime(
                            data["cr_birthday"], "%Y-%m-%d"
                        ).date()
                    elif isinstance(data["cr_birthday"], date):
                        birthday = data["cr_birthday"]
                except ValueError:
                    return {
                        "success": False,
                        "error": "Invalid date format for birthday (use YYYY-MM-DD)",
                    }
            new_cr_id = self.generate_cr_id() 
            # Tạo ConsultRegistration object
            consultation = ConsultRegistration(
                cr_id=new_cr_id,
                course_id=data["course_id"],
                cr_fullname=data.get("cr_fullname"),
                cr_birthday=birthday,
                cr_phone=data.get("cr_phone"),
                cr_email=data.get("cr_email"),
                cr_gender=data.get("cr_gender"),
            )
            verify_email_token = generate_email_verification_token()
            try:
                send_email(
                     consultation.cr_email, consultation.cr_id, verify_email_token
                )
            except Exception as e:
                current_app.logger.error(f"Error sending verification email: {e}")

            # Save to database
            self.db.session.add(consultation)
            self.db.session.commit()

            # Optional: Gửi email thông báo (nếu cần)
            if consultation.cr_email:
                try:
                    self._send_consultation_confirmation_email(consultation)
                except Exception as e:
                    current_app.logger.error(
                        f"Error sending consultation confirmation email: {e}"
                    )
                    # Không return error vì đăng ký đã thành công

            return {
                "success": True,
                "message": "Consultation registration created successfully",
                "data": consultation.to_dict(include_course=True),
            }

        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Database integrity error: {str(e)}")
            return {
                "success": False,
                "error": "Database integrity error. Registration could not be created.",
            }
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error creating consultation registration: {str(e)}")
            return {
                "success": False,
                "error": f"Error creating consultation registration: {str(e)}",
            }
            
    def generate_cr_id(self) -> int:
        try:
            last_cr_id = ConsultRegistration.query.order_by(ConsultRegistration.cr_id.desc()).first()
            if last_cr_id:
                return last_cr_id.cr_id + 1
            return 1
        except Exception as e:
            current_app.logger.error(f"Error generating consultation registration ID: {str(e)}")
            raise Exception(f"Error generating consultation registration ID: {str(e)}")

