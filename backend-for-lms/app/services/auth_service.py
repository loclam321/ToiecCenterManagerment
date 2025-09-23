import jwt
import datetime
from typing import Dict, Any, Optional, Tuple
from flask import current_app
from app.config import db
from app.models.student_model import Student
from app.models.teacher_model import Teacher
from werkzeug.security import check_password_hash, generate_password_hash


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
            access_token = self._create_token(teacher.user_id, "teacher")
            return {
                "success": True,
                "access_token": access_token,
                "user": teacher.to_dict(),
                "role": "teacher"
            }
            
        # Kiểm tra student
        student = self.db.session.query(Student).filter_by(user_email=email).first()
        if student and student.check_password(password):
            access_token = self._create_token(student.user_id, "student")
            return {
                "success": True,
                "access_token": access_token,
                "user": student.to_dict(),
                "role": "student"
            }
            
        # Không tìm thấy hoặc sai mật khẩu
        return {
            "success": False,
            "error": "Invalid email or password"
        }
    
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
                return {
                    "success": False,
                    "error": "Email already exists"
                }
                
            # Tạo user_id mới
            user_id = self._generate_student_id()
            
            # Tạo student mới
            password = data.pop("password", None)  # Lấy password ra
            if not password:
                return {"success": False, "error": "Password is required"}
                
            student = Student(user_id=user_id, **data)
            student.set_password(password)
            
            self.db.session.add(student)
            self.db.session.commit()
            
            # Tạo token
            access_token = self._create_token(student.user_id, "student")
            
            return {
                "success": True,
                "message": "Student registered successfully",
                "access_token": access_token,
                "user": student.to_dict(),
                "role": "student"
            }
            
        except Exception as e:
            self.db.session.rollback()
            return {
                "success": False,
                "error": f"Registration failed: {str(e)}"
            }
    
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
                return {
                    "success": False,
                    "error": "Email already exists"
                }
                
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
                "role": "teacher"
            }
            
        except Exception as e:
            self.db.session.rollback()
            return {
                "success": False,
                "error": f"Registration failed: {str(e)}"
            }
    
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
                token, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithms=['HS256']
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
                return {
                    "user": teacher.to_dict(),
                    "role": "teacher"
                }
        elif role == "student":
            student = self.db.session.query(Student).filter_by(user_id=user_id).first()
            if student:
                return {
                    "user": student.to_dict(),
                    "role": "student"
                }
                
        return None
    
    def change_password(self, user_id: str, role: str, old_password: str, new_password: str) -> Dict[str, Any]:
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
                return {
                    "success": False,
                    "error": "User not found"
                }
                
            # Kiểm tra mật khẩu cũ
            if not user.check_password(old_password):
                return {
                    "success": False,
                    "error": "Incorrect old password"
                }
                
            # Đặt mật khẩu mới
            user.set_password(new_password)
            self.db.session.commit()
            
            return {
                "success": True,
                "message": "Password changed successfully"
            }
            
        except Exception as e:
            self.db.session.rollback()
            return {
                "success": False,
                "error": f"Failed to change password: {str(e)}"
            }

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
            return {
                "success": False,
                "error": "Invalid token"
            }
            
        # Tạo token mới
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id or not role:
            return {
                "success": False,
                "error": "Invalid token payload"
            }
            
        new_token = self._create_token(user_id, role)
        
        return {
            "success": True,
            "access_token": new_token
        }
    
    # Helper methods
    def _create_token(self, user_id: str, role: str) -> str:
        """Tạo JWT token với thông tin user"""
        from flask import current_app
        
        # Lấy JWT_SECRET_KEY từ config
        secret_key = current_app.config.get('JWT_SECRET_KEY')
        if not secret_key:
            raise ValueError("JWT_SECRET_KEY not configured")
            
        payload = {
            "sub": user_id,  # subject (user_id)
            "role": role,    # role (teacher/student)
            "iat": datetime.datetime.utcnow(),  # issued at
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # hết hạn sau 24h
        }
        
        token = jwt.encode(
            payload,
            secret_key,
            algorithm="HS256"
        )
        
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
        last_student = self.db.session.query(Student).order_by(Student.user_id.desc()).first()
        
        if not last_student:
            return "S00000001"  # ID đầu tiên
            
        if last_student.user_id.startswith('S') and len(last_student.user_id) == 9:
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
        last_teacher = self.db.session.query(Teacher).order_by(Teacher.user_id.desc()).first()
        
        if not last_teacher:
            return "T00000001"  # ID đầu tiên
            
        if last_teacher.user_id.startswith('T') and len(last_teacher.user_id) == 9:
            try:
                num = int(last_teacher.user_id[1:])
                return f"T{(num + 1):08d}"
            except ValueError:
                pass
                
        # Fallback: số giáo viên + 1
        count = self.db.session.query(Teacher).count()
        return f"T{(count + 1):08d}"