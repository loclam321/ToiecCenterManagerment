from re import DEBUG
import jwt
import datetime
import secrets
from typing import Dict, Any, Optional, Tuple
from flask import current_app
from app.config import db
from app.models.student_model import Student
from app.models.teacher_model import Teacher
from werkzeug.security import check_password_hash, generate_password_hash
from app.config import mail
from flask_mail import Message


class AuthService:
    def __init__(self, database=None):
        self.db = database or db

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Xác thực người dùng và tạo access token

        Args:
            email: Email đăng nhập
            password: Mật khẩu

        Returns:
            Dict với access_token, user_info và role nếu thành công,
            Dict với error nếu thất bại
        """
        # Kiểm tra teacher
        teacher = self.db.session.query(Teacher).filter_by(user_email=email).first()
        if teacher and teacher.check_password(password):
            # Với teacher, có thể không cần xác minh email
            access_token = self._create_token(teacher.user_id, "teacher")
            return {
                "success": True,
                "access_token": access_token,
                "user": teacher.to_dict(),
                "role": "teacher",
            }

        # Kiểm tra student
        student = self.db.session.query(Student).filter_by(user_email=email).first()
        print("Student found:", student.user_id)
        print("Student email:", student.user_email)
        print("Password:", password)
        print("password hash:", generate_password_hash(password))
        print("Student stored password hash:", student.user_password)
        print("Student password check:", student.check_password(password))
        if student and student.check_password(password):

            # Kiểm tra xem email đã được xác minh chưa
            if not student.is_email_verified:
                return {
                    "success": False,
                    "error": "Email not verified. Please check your inbox and verify your email before logging in.",
                }

            # Chỉ cho đăng nhập nếu email đã xác minh
            access_token = self._create_token(student.user_id, "student")
            return {
                "success": True,
                "access_token": access_token,
                "user": student.to_dict(),
                "role": "student",
            }

        # Không tìm thấy hoặc sai mật khẩu
        return {"success": False, "error": "Invalid email or password"}

    def register_student(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Đăng ký tài khoản học viên mới

        Args:
            data: Thông tin học viên

        Returns:
            Dict với kết quả đăng ký
        """
        try:
            # Kiểm tra email tồn tại
            if self._check_email_exists(data.get("user_email")):
                return {"success": False, "error": "Email already exists"}

            # Tạo user_id mới
            user_id = self._generate_student_id()

            # Tạo student mới
            password = data.pop("user_password", None)  # Lấy password ra
            if not password:
                return {"success": False, "error": "Password is required"}

            # Thiết lập trạng thái xác thực email
            data["is_email_verified"] = False

            # Tạo token xác minh email
            verification_token = self._generate_verification_token()

            student = Student(user_id=user_id, **data)
            student.set_password(password)

            self.db.session.add(student)
            self.db.session.commit()

            # Gửi email xác nhận
            try:
                self._send_verification_email(
                    student.user_email, student.user_id, verification_token
                )
            except Exception as e:
                # Log lỗi nhưng không làm fail quá trình đăng ký
                current_app.logger.error(f"Error sending verification email: {e}")

            # Tạo token đăng nhập (nhưng người dùng vẫn cần xác minh email để đăng nhập)
            access_token = self._create_token(student.user_id, "student")

            return {
                "success": True,
                "message": "Student registered successfully. Please check your email to verify your account.",
                "access_token": access_token,
                "user": student.to_dict(),
                "role": "student",
            }

        except Exception as e:
            self.db.session.rollback()
            return {"success": False, "error": f"Registration failed: {str(e)}"}

    def register_teacher(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Đăng ký tài khoản giáo viên mới

        Args:
            data: Thông tin giáo viên

        Returns:
            Dict với kết quả đăng ký
        """
        try:
            # Kiểm tra email tồn tại
            if self._check_email_exists(data.get("user_email")):
                return {"success": False, "error": "Email already exists"}

            # Tạo user_id mới
            user_id = self._generate_teacher_id()

            # Tạo teacher mới
            password = data.pop("password", None)  # Lấy password ra
            if not password:
                return {"success": False, "error": "Password is required"}

            teacher = Teacher(user_id=user_id, **data)
            teacher.set_password(password)

            self.db.session.add(teacher)
            self.db.session.commit()

            # Tạo token
            access_token = self._create_token(teacher.user_id, "teacher")

            return {
                "success": True,
                "message": "Teacher registered successfully",
                "access_token": access_token,
                "user": teacher.to_dict(),
                "role": "teacher",
            }

        except Exception as e:
            self.db.session.rollback()
            return {"success": False, "error": f"Registration failed: {str(e)}"}

    def verify_token(self, token: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Xác minh token và trả về thông tin

        Args:
            token: JWT token cần xác minh

        Returns:
            (is_valid, payload): Tuple gồm trạng thái token và thông tin trong token
        """
        try:
            from flask import current_app

            payload = jwt.decode(
                token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
            )
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, {"error": "Token expired"}
        except jwt.InvalidTokenError:
            return False, {"error": "Invalid token"}

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Lấy thông tin user từ token

        Args:
            token: JWT token

        Returns:
            Dict thông tin user hoặc None nếu token không hợp lệ
        """
        is_valid, payload = self.verify_token(token)
        if not is_valid:
            return None

        user_id = payload.get("sub")
        role = payload.get("role")

        if role == "teacher":
            teacher = self.db.session.query(Teacher).filter_by(user_id=user_id).first()
            if teacher:
                return {"user": teacher.to_dict(), "role": "teacher"}
        elif role == "student":
            student = self.db.session.query(Student).filter_by(user_id=user_id).first()
            if student:
                return {"user": student.to_dict(), "role": "student"}

        return None

    def change_password(
        self, user_id: str, role: str, old_password: str, new_password: str
    ) -> Dict[str, Any]:
        """
        Thay đổi mật khẩu người dùng

        Args:
            user_id: ID người dùng
            role: Vai trò (teacher/student)
            old_password: Mật khẩu cũ
            new_password: Mật khẩu mới

        Returns:
            Dict kết quả thay đổi mật khẩu
        """
        try:
            user = None
            if role == "teacher":
                user = self.db.session.query(Teacher).filter_by(user_id=user_id).first()
            elif role == "student":
                user = self.db.session.query(Student).filter_by(user_id=user_id).first()

            if not user:
                return {"success": False, "error": "User not found"}

            # Kiểm tra mật khẩu cũ
            if not user.check_password(old_password):
                return {"success": False, "error": "Incorrect old password"}

            # Đặt mật khẩu mới
            user.set_password(new_password)
            self.db.session.commit()

            return {"success": True, "message": "Password changed successfully"}

        except Exception as e:
            self.db.session.rollback()
            return {"success": False, "error": f"Failed to change password: {str(e)}"}

    def refresh_token(self, token: str) -> Dict[str, Any]:
        """
        Làm mới token

        Args:
            token: Token hiện tại

        Returns:
            Dict với token mới
        """
        is_valid, payload = self.verify_token(token)
        if not is_valid:
            return {"success": False, "error": "Invalid token"}

        # Tạo token mới
        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id or not role:
            return {"success": False, "error": "Invalid token payload"}

        new_token = self._create_token(user_id, role)

        return {"success": True, "access_token": new_token}

    def forgot_password(self, email: str) -> Dict[str, Any]:
        """
        Xử lý yêu cầu quên mật khẩu

        Args:
            email: Email của người dùng

        Returns:
            Dict kết quả xử lý
        """
        try:
            # Kiểm tra email tồn tại - ưu tiên student trước
            student = self.db.session.query(Student).filter_by(user_email=email).first()
            teacher = None

            if student:
                user_id = student.user_id
                role = "student"
            else:
                teacher = (
                    self.db.session.query(Teacher).filter_by(user_email=email).first()
                )
                if teacher:
                    user_id = teacher.user_id
                    role = "teacher"
                else:
                    # Trả về thành công dù không tìm thấy để tránh lộ thông tin
                    return {
                        "success": True,
                        "message": "If your email exists, a password reset link has been sent",
                    }

            # Tạo JWT token cho reset password
            payload = {
                "user_id": user_id,
                "role": role,
                "purpose": "password_reset",
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(hours=1),  # Hết hạn sau 1 giờ
            }

            reset_token = jwt.encode(
                payload, current_app.config.get("JWT_SECRET_KEY"), algorithm="HS256"
            )

            # Gửi email reset password
            self._send_password_reset_email(email, user_id, reset_token)

            return {
                "success": True,
                "message": "If your email exists, a password reset link has been sent",
            }

        except Exception as e:
            current_app.logger.error(f"Error in forgot_password: {e}")
            # Vẫn trả về thành công để tránh lộ thông tin
            return {
                "success": True,
                "message": "If your email exists, a password reset link has been sent",
            }

    def _send_password_reset_email(self, email, user_id, token):
        """Gửi email đặt lại mật khẩu"""
        # URL đặt lại mật khẩu - sử dụng FRONTEND_URL từ config
        reset_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/login?mode=reset/{token}"

        subject = "Đặt lại mật khẩu tài khoản LMS của bạn"

        html_body = f"""
        <h2>Đặt lại mật khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Vui lòng nhấn vào <a href="{reset_url}">liên kết này</a> để đặt lại mật khẩu.</p>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        """

        msg = Message(subject=subject, recipients=[email], html=html_body)
        mail.send(msg)

    def verify_reset_token(self, token: str) -> Dict[str, Any]:
        """
        Xác thực token đặt lại mật khẩu

        Args:
            token: Token reset password

        Returns:
            Dict thông tin token nếu hợp lệ
        """
        try:
            payload = jwt.decode(
                token, current_app.config.get("JWT_SECRET_KEY"), algorithms=["HS256"]
            )

            # Kiểm tra mục đích sử dụng token
            if payload.get("purpose") != "password_reset":
                return {"success": False, "message": "Invalid token purpose"}

            return {
                "success": True,
                "user_id": payload.get("user_id"),
                "role": payload.get("role"),
            }

        except jwt.ExpiredSignatureError:
            return {"success": False, "message": "Token has expired"}
        except jwt.InvalidTokenError:
            return {"success": False, "message": "Invalid token"}

    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Đặt lại mật khẩu

        Args:
            token: Token xác thực
            new_password: Mật khẩu mới

        Returns:
            Dict kết quả đặt lại mật khẩu
        """
        # Xác thực token
        token_data = self.verify_reset_token(token)
        if not token_data["success"]:
            return token_data

        user_id = token_data["user_id"]
        role = token_data["role"]

        try:
            # Tìm người dùng
            user = None
            if role == "student":
                user = self.db.session.query(Student).filter_by(user_id=user_id).first()
            elif role == "teacher":
                user = self.db.session.query(Teacher).filter_by(user_id=user_id).first()

            if not user:
                return {"success": False, "message": "User not found"}

            # Cập nhật mật khẩu
            user.set_password(new_password)
            self.db.session.commit()

            return {"success": True, "message": "Password has been reset successfully"}

        except Exception as e:
            self.db.session.rollback()
            return {"success": False, "message": f"Error resetting password: {str(e)}"}

    # Helper methods
    def _create_token(self, user_id: str, role: str) -> str:
        """Tạo JWT token với thông tin user"""
        from flask import current_app

        # Lấy JWT_SECRET_KEY từ config
        secret_key = current_app.config.get("JWT_SECRET_KEY")
        if not secret_key:
            raise ValueError("JWT_SECRET_KEY not configured")

        payload = {
            "sub": user_id,  # subject (user_id)
            "role": role,  # role (teacher/student)
            "iat": datetime.datetime.utcnow(),  # issued at
            "exp": datetime.datetime.utcnow()
            + datetime.timedelta(hours=24),  # hết hạn sau 24h
        }

        token = jwt.encode(payload, secret_key, algorithm="HS256")

        return token

    def _check_email_exists(self, email: str) -> bool:
        """Kiểm tra email đã tồn tại chưa"""
        if not email:
            return False

        teacher = self.db.session.query(Teacher).filter_by(user_email=email).first()
        if teacher:
            return True

        student = self.db.session.query(Student).filter_by(user_email=email).first()
        if student:
            return True

        return False

    def _generate_student_id(self) -> str:
        """Sinh ID học viên tự động"""
        last_student = (
            self.db.session.query(Student).order_by(Student.user_id.desc()).first()
        )

        if not last_student:
            return "S00000001"  # ID đầu tiên

        if last_student.user_id.startswith("S") and len(last_student.user_id) == 9:
            try:
                num = int(last_student.user_id[1:])
                return f"S{(num + 1):08d}"
            except ValueError:
                pass

        # Fallback: số học viên + 1
        count = self.db.session.query(Student).count()
        return f"S{(count + 1):08d}"

    def _generate_teacher_id(self) -> str:
        """Sinh ID giáo viên tự động"""
        last_teacher = (
            self.db.session.query(Teacher).order_by(Teacher.user_id.desc()).first()
        )

        if not last_teacher:
            return "T00000001"  # ID đầu tiên

        if last_teacher.user_id.startswith("T") and len(last_teacher.user_id) == 9:
            try:
                num = int(last_teacher.user_id[1:])
                return f"T{(num + 1):08d}"
            except ValueError:
                pass

        # Fallback: số giáo viên + 1
        count = self.db.session.query(Teacher).count()
        return f"T{(count + 1):08d}"

    def _generate_verification_token(self) -> str:
        """Tạo JWT token cho xác minh email"""
        return secrets.token_urlsafe(32)

    def _send_verification_email(self, email, user_id, token):
        """Gửi email xác nhận tới người dùng"""
        # Tạo JWT token chứa thông tin user_id
        payload = {
            "user_id": user_id,
            "purpose": "email_verification",
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1),
        }

        jwt_token = jwt.encode(
            payload, current_app.config.get("JWT_SECRET_KEY"), algorithm="HS256"
        )

        # URL xác minh với token
        verification_url = f"{current_app.config.get('BASE_URL', 'http://localhost:5000')}/api/auth/verify-email/{jwt_token}"

        subject = "Xác minh tài khoản LMS của bạn"

        html_body = f"""
        <h2>Xác minh tài khoản của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống LMS.</p>
        <p>Vui lòng nhấn vào <a href="{verification_url}">liên kết này</a> để xác minh tài khoản.</p>
        <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
        <p>Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.</p>
        """

        msg = Message(subject=subject, recipients=[email], html=html_body)

        mail.send(msg)

    def _decode_verification_token(self, token):
        """Giải mã token xác minh email"""
        try:
            payload = jwt.decode(
                token, current_app.config.get("JWT_SECRET_KEY"), algorithms=["HS256"]
            )

            # Kiểm tra mục đích sử dụng
            if payload.get("purpose") != "email_verification":
                return None

            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def verify_email(self, token: str) -> Dict[str, Any]:
        """
        Xác minh email người dùng

        Args:
            token: Token xác minh email

        Returns:
            Dict kết quả xác minh
        """
        try:
            # Giải mã JWT token
            payload = self._decode_verification_token(token)
            if not payload:
                return {
                    "success": False,
                    "message": "Invalid or expired verification token",
                }

            user_id = payload.get("user_id")
            if not user_id:
                return {"success": False, "message": "Invalid token content"}

            # Tìm học viên
            student = self.db.session.query(Student).filter_by(user_id=user_id).first()
            if not student:
                return {"success": False, "message": "User not found"}

            # Cập nhật trạng thái xác minh
            if student.is_email_verified:
                return {"success": True, "message": "Email already verified"}

            student.is_email_verified = True
            self.db.session.commit()

            return {"success": True, "message": "Email verified successfully"}

        except Exception as e:
            self.db.session.rollback()
            return {"success": False, "message": f"Error verifying email: {str(e)}"}

    def resend_verification_email(self, email: str) -> Dict[str, Any]:
        """
        Gửi lại email xác minh

        Args:
            email: Email người dùng

        Returns:
            Dict kết quả gửi email
        """
        try:
            # Tìm student với email
            student = self.db.session.query(Student).filter_by(user_email=email).first()

            if not student:
                # Trả về thành công dù không tìm thấy để tránh lộ thông tin
                return {
                    "success": True,
                    "message": "If your email exists, a verification link has been sent",
                }

            if student.is_email_verified:
                return {"success": True, "message": "Email already verified"}

            # Tạo token mới và gửi email
            verification_token = self._generate_verification_token()
            self._send_verification_email(
                student.user_email, student.user_id, verification_token
            )

            return {"success": True, "message": "Verification email has been sent"}

        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to send verification email: {str(e)}",
            }
