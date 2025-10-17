import email
from enum import verify
from typing import Dict, Any
from datetime import datetime, date
from flask import current_app
from sqlalchemy.exc import IntegrityError

from app.config import db
from app.models.consult_registration_model import ConsultRegistration
from app.models.course_model import Course
from app.utils.email_utils import verify_email_token, generate_email_verification_token, send_verification_email


class ConsultRegistrationService:
    def __init__(self):
        self.db = db

    def send_verification_email(self, data: Dict[str, Any]) -> Dict[str, Any]:
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
                return {"success": False, "error": "Course not found"}

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

            # Generate new CR ID
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
            email_sent = False
            if consultation.cr_email:
                try:
                    verify_token = generate_email_verification_token(consultation.cr_id,consultation)
                    send_verification_email(consultation.cr_email, verify_token)
                    email_sent = True
                except Exception as e:
                    current_app.logger.error(
                        f"Error sending verification email to {consultation.cr_email}: {e}"
                    )
                    # Không return error vì consultation đã được tạo thành công

            # ✅ RETURN MESSAGE PHÙ HỢP
            message = "Consultation registration created successfully"
            if email_sent:
                message += ". Please check your email to verify your registration"
            elif consultation.cr_email:
                message += ", but verification email could not be sent"

            return {
                "success": True,
                "message": message,
                "data": consultation.to_dict(include_course=True),
                "email_sent": email_sent,  # Optional: để frontend biết email đã gửi chưa
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
            current_app.logger.error(
                f"Error creating consultation registration: {str(e)}"
            )
            return {
                "success": False,
                "error": f"Error creating consultation registration: {str(e)}",
            }

    def generate_cr_id(self) -> int:
        """Generate new CR ID (auto increment)"""
        try:
            last_cr = ConsultRegistration.query.order_by(
                ConsultRegistration.cr_id.desc()
            ).first()
            if last_cr:
                return last_cr.cr_id + 1
            return 1
        except Exception as e:
            current_app.logger.error(f"Error generating CR ID: {str(e)}")
            raise Exception(f"Error generating CR ID: {str(e)}")

    def verify_email(self, token: str) -> Dict[str, Any]:
        try:
            payload = verify_email_token(token)
            if not payload:
                return {"success": False, "error": "Invalid or expired token"}

            cr_id = payload.get("user_id")
            consultation = ConsultRegistration.query.get(cr_id)
            if not consultation:
                return {"success": False, "error": "Consultation registration not found"}

            if consultation.is_email_verified:
                return {
                    "success": True,
                    "message": "Email already verified",
                    "data": consultation.to_dict(include_course=True),
                }

            consultation.is_email_verified = True
            self.db.session.commit()

            return {
                "success": True,
                "message": "Email verified successfully",
                "data": consultation.to_dict(include_course=True),
            }
        except Exception as e:
            current_app.logger.error(f"Error verifying email: {str(e)}")
            return {"success": False, "error": f"Error verifying email: {str(e)}"}