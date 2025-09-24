from app.config import db
from app.models.student_model import Student
from sqlalchemy.exc import IntegrityError
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, date
import re
import uuid
from app.utils.email_utils import send_verification_email


class ValidationError(Exception):
    """Exception cho lỗi validation"""

    def __init__(self, errors):
        self.errors = errors
        super().__init__("Validation failed")


class RegisterService:
    """Service xử lý đăng ký tài khoản học viên"""

    def __init__(self, database=None):
        self.db = database or db

    def register_student(self, data: Dict[str, Any], send_email=True) -> Student:
        """
        Đăng ký tài khoản học viên mới và gửi email xác nhận

        Args:
            data: Dict chứa thông tin học viên
            send_email: Có gửi email xác nhận không

        Returns:
            Student: Đối tượng Student đã tạo

        Raises:
            ValidationError: Khi dữ liệu không hợp lệ
            IntegrityError: Khi vi phạm ràng buộc database
            Exception: Các lỗi khác
        """
        # Kiểm tra dữ liệu
        errors = self._validate_student_data(data)
        if errors:
            raise ValidationError(errors)

        # Kiểm tra email đã tồn tại
        if self._check_email_exists(data["user_email"]):
            raise ValidationError({"user_email": "Email already exists"})

        # Tạo student_id
        user_id = self._generate_student_id()

        # Chuẩn bị dữ liệu
        student_data = {
            "user_id": user_id,
            "user_name": data.get("user_name"),
            "user_email": data.get("user_email"),
            "user_gender": data.get("user_gender"),
            "user_telephone": data.get("user_telephone"),
            "sd_startlv": data.get("sd_startlv", "BEGINNER"),
            "sd_enrollmenttdate": date.today(),
            "is_email_verified": False,  # Mặc định chưa xác minh
        }

        # Xử lý ngày sinh nếu có
        if "user_birthday" in data and data["user_birthday"]:
            try:
                if isinstance(data["user_birthday"], str):
                    student_data["user_birthday"] = datetime.strptime(
                        data["user_birthday"], "%Y-%m-%d"
                    ).date()
                else:
                    student_data["user_birthday"] = data["user_birthday"]
            except ValueError:
                raise ValidationError(
                    {"user_birthday": "Invalid date format. Use YYYY-MM-DD"}
                )

        # Tạo đối tượng Student
        student = Student(**student_data)

        # Hash mật khẩu
        if "user_password" in data and data["user_password"]:
            student.set_password(data["user_password"])
        else:
            raise ValidationError({"user_password": "Password is required"})

        # Lưu vào database
        try:
            self.db.session.add(student)
            self.db.session.commit()
            # Gửi email xác nhận nếu cần
            if send_email:
                try:
                    from flask import current_app

                    send_verification_email(
                        current_app.extensions["mail"],
                        student.user_email,
                        student.user_id,
                    )
                except Exception as e:
                    # Log lỗi nhưng không làm fail quá trình đăng ký
                    current_app.logger.error(f"Error sending verification email: {e}")
            return student
        except IntegrityError:
            self.db.session.rollback()
            raise
        except Exception:
            self.db.session.rollback()
            raise

    def _validate_student_data(self, data: Dict[str, Any]) -> Dict[str, str]:
        """
        Kiểm tra tính hợp lệ của dữ liệu đăng ký

        Returns:
            Dict errors nếu có lỗi, empty dict nếu hợp lệ
        """
        errors = {}

        # Kiểm tra các trường bắt buộc
        if not data.get("user_email"):
            errors["user_email"] = "Email is required"
        elif not self._is_valid_email(data.get("user_email")):
            errors["user_email"] = "Invalid email format"

        if not data.get("user_password"):
            errors["user_password"] = "Password is required"
        elif len(data.get("user_password", "")) < 6:
            errors["user_password"] = "Password must be at least 6 characters"

        if not data.get("user_name"):
            errors["user_name"] = "Name is required"

        # Kiểm tra giới tính
        if data.get("user_gender") and data.get("user_gender") not in [
            "M",
            "F",
            "m",
            "f",
        ]:
            errors["user_gender"] = "Gender must be 'M' or 'F'"

        # Kiểm tra định dạng số điện thoại
        if data.get("user_telephone") and not self._is_valid_phone(
            data.get("user_telephone")
        ):
            errors["user_telephone"] = "Invalid phone number format"

        return errors

    def _is_valid_email(self, email: str) -> bool:
        """Kiểm tra email có định dạng hợp lệ"""
        if not email:
            return False
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return bool(re.match(pattern, email))

    def _is_valid_phone(self, phone: str) -> bool:
        """Kiểm tra số điện thoại có định dạng hợp lệ"""
        if not phone:
            return True  # Cho phép để trống
        pattern = r"^[0-9+\-\s]{8,15}$"
        return bool(re.match(pattern, phone))

    def _check_email_exists(self, email: str) -> bool:
        """Kiểm tra email đã tồn tại trong database chưa"""
        if not email:
            return False
        return (
            self.db.session.query(Student).filter(Student.user_email == email).first()
            is not None
        )

    def _generate_student_id(self) -> str:
        """Sinh ID học viên tự động theo định dạng S00000001"""
        # Phương thức này giữ nguyên
        last_student = (
            self.db.session.query(Student).order_by(Student.user_id.desc()).first()
        )
        if not last_student:
            return "S00000001"
        if last_student.user_id.startswith("S") and len(last_student.user_id) == 9:
            try:
                num = int(last_student.user_id[1:])
                return f"S{(num + 1):08d}"
            except ValueError:
                pass
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"S{unique_id}"

    def verify_email(self, token: str) -> Dict[str, Any]:
        """
        Xác minh email dựa trên token JWT

        Args:
            token: JWT token

        Returns:
            Dict thông báo kết quả
        """
        from app.utils.email_utils import verify_email_token

        # Giải mã và kiểm tra token
        payload = verify_email_token(token)

        if not payload:
            return {"success": False, "message": "Invalid or expired verification link"}

        # Lấy user_id từ payload
        user_id = payload.get("user_id")
        if not user_id:
            return {"success": False, "message": "Invalid token content"}

        # Tìm student với user_id
        student = self.db.session.query(Student).filter_by(user_id=user_id).first()
        if not student:
            return {"success": False, "message": "User not found"}

        # Nếu đã xác minh rồi
        if student.is_email_verified:
            return {"success": True, "message": "Email already verified"}

        try:
            # Cập nhật trạng thái xác minh
            student.is_email_verified = True
            self.db.session.commit()

            return {"success": True, "message": "Email verified successfully"}
        except Exception as e:
            self.db.session.rollback()
            return {"success": False, "message": f"Error verifying email: {str(e)}"}
