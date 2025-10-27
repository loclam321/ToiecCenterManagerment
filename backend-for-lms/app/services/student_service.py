from enum import verify
from typing import Dict, Any, List, Optional
from app.routes.auth_route import verify_email
from sqlalchemy.exc import IntegrityError
from flask import current_app
from app.config import db
from app.models.student_model import Student
from datetime import datetime, date
from werkzeug.security import generate_password_hash
from werkzeug.exceptions import NotFound, BadRequest, Conflict
from app.utils.email_utils import  generate_email_verification_token, send_verification_email,send_password_to_student


class StudentService:
    """Service for managing student data"""

    def __init__(self, database=None):
        self.db = database or db

    def get_all_students(self, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        Retrieve all students with pagination

        Args:
            page: Page number
            per_page: Number of students per page

        Returns:
            Dict with students data and pagination info
        """
        try:
            pagination = Student.query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            students = pagination.items

            return {
                "success": True,
                "data": {
                    "students": [student.to_dict() for student in students],
                    "pagination": {
                        "total": pagination.total,
                        "pages": pagination.pages,
                        "page": page,
                        "per_page": per_page,
                        "has_next": pagination.has_next,
                        "has_prev": pagination.has_prev,
                    },
                },
            }
        except Exception as e:
            current_app.logger.error(f"Error retrieving students: {str(e)}")
            return {"success": False, "error": f"Error retrieving students: {str(e)}"}

    def get_student_by_id(self, student_id: str) -> Dict[str, Any]:
        """
        Retrieve student by ID

        Args:
            student_id: Student ID

        Returns:
            Dict with student data
        """
        try:
            student = Student.query.filter_by(user_id=student_id).first()
            if not student:
                return {
                    "success": False,
                    "error": f"Student with ID {student_id} not found",
                }

            return {"success": True, "data": student.to_dict()}
        except Exception as e:
            current_app.logger.error(f"Error retrieving student {student_id}: {str(e)}")
            return {"success": False, "error": f"Error retrieving student: {str(e)}"}

    def create_student(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Validate required fields
            required_fields = ["user_name", "user_email"]
            for field in required_fields:
                if field not in data or not data[field]:
                    return {
                        "success": False,
                        "error": f"Missing required field: {field}",
                    }

            # Check if email already exists
            if Student.query.filter_by(user_email=data["user_email"]).first():
                return {"success": False, "error": "Email already exists"}

            # Generate new ID
            new_id = self.generate_student_id()

            # Process birthday if provided
            if "user_birthday" in data and data["user_birthday"]:
                try:
                    if isinstance(data["user_birthday"], str):
                        data["user_birthday"] = datetime.strptime(
                            data["user_birthday"], "%Y-%m-%d"
                        ).date()
                except ValueError:
                    return {
                        "success": False,
                        "error": "Invalid date format for birthday (use YYYY-MM-DD)",
                    }
                    
                    
            password = data.pop("user_password", None)  # Lấy password ra
            if not password:
                return {"success": False, "error": "Password is required"}

            # ✅ CÁCH 2: Tạo object trực tiếp (bớt 10 dòng code)
            student = Student(user_id=new_id, **data)
            student.set_password(password)  # Thiết lập mật khẩu sau
            
            send_password_to_student(
                to_email=student.user_email,
                student_name=student.user_name,
                password=password
            )

            self.db.session.add(student)
            self.db.session.commit()
            

            return {
                "success": True,
                "message": "Student created successfully",
                "data": student.to_dict(),
            }

        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Database integrity error: {str(e)}")
            return {
                "success": False,
                "error": "Database integrity error. Student could not be created.",
            }
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error creating student: {str(e)}")
            return {"success": False, "error": f"Error creating student: {str(e)}"}

    def update_student(self, student_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing student

        Args:
            student_id: Student ID
            data: Updated student data

        Returns:
            Dict with updated student data
        """
        try:
            # ensure student_id is a string
            sid = str(student_id)

            student = Student.query.filter_by(user_id=sid).first()
            if not student:
                return {
                    "success": False,
                    "error": f"Student with ID {sid} not found",
                }

            # Only allow update of a safe subset of fields here (defence-in-depth)
            allowed = {
                "user_name",
                "user_email",
                "user_gender",
                "user_birthday",
                "user_telephone",
                "sd_startlv",
                "sd_enrollmenttdate",
                # note: is_email_verified typically set by admin/verification flow
            }

            # sanitize & normalize input
            cleaned: Dict[str, Any] = {}
            for k, v in (data or {}).items():
                if k not in allowed:
                    continue
                # trim strings
                if isinstance(v, str):
                    v = v.strip()
                cleaned[k] = v

            # user_email: check uniqueness if provided
            if "user_email" in cleaned and cleaned["user_email"]:
                existing = (
                    Student.query.filter(
                        Student.user_email == cleaned["user_email"],
                        Student.user_id != sid,
                    ).first()
                )
                if existing:
                    return {"success": False, "error": "Email already in use by another student"}

            # user_gender: validate
            if "user_gender" in cleaned and cleaned["user_gender"]:
                if cleaned["user_gender"] not in ("M", "F", "O"):
                    return {"success": False, "error": "Invalid gender value"}

            # Dates: robust parsing (accept YYYY-MM-DD or ISO)
            def parse_date_field(val):
                if val is None or val == "":
                    return None
                if isinstance(val, date):
                    return val
                if isinstance(val, str):
                    try:
                        return date.fromisoformat(val)
                    except Exception:
                        try:
                            return datetime.strptime(val, "%Y-%m-%d").date()
                        except Exception:
                            return None
                return None

            if "user_birthday" in cleaned:
                parsed = parse_date_field(cleaned["user_birthday"])
                if cleaned["user_birthday"] and not parsed:
                    return {"success": False, "error": "Invalid date format for birthday (use YYYY-MM-DD)"}
                cleaned["user_birthday"] = parsed

            if "sd_startlv" in cleaned:
                # keep whatever is provided but trim
                cleaned["sd_startlv"] = cleaned["sd_startlv"] or None

            if "sd_enrollmenttdate" in cleaned:
                parsed = parse_date_field(cleaned["sd_enrollmenttdate"])
                if cleaned["sd_enrollmenttdate"] and not parsed:
                    return {"success": False, "error": "Invalid date format for enrollment date (use YYYY-MM-DD)"}
                cleaned["sd_enrollmenttdate"] = parsed

            # phone: normalize basic
            if "user_telephone" in cleaned and cleaned["user_telephone"]:
                tel = str(cleaned["user_telephone"]).replace(" ", "").replace("-", "")
                if len(tel) > 20:
                    return {"success": False, "error": "Số điện thoại quá dài"}
                cleaned["user_telephone"] = tel

            # Apply updates
            for k, v in cleaned.items():
                setattr(student, k, v)

            # Keep password change separate and explicit if ever allowed
            if "user_password" in data and data.get("user_password"):
                student.set_password(data.get("user_password"))

            # touch updated_at
            student.updated_at = datetime.now()

            self.db.session.commit()

            return {"success": True, "message": "Student updated successfully", "data": student.to_dict()}

        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Database integrity error: {str(e)}")
            return {"success": False, "error": "Database integrity error. Student could not be updated."}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error updating student {student_id}: {str(e)}")
            return {"success": False, "error": f"Error updating student: {str(e)}"}

    def delete_student(self, student_id: str) -> Dict[str, Any]:
        """
        Delete a student

        Args:
            student_id: Student ID

        Returns:
            Dict with deletion result
        """
        try:
            student = Student.query.filter_by(user_id=student_id).first()
            if not student:
                return {
                    "success": False,
                    "error": f"Student with ID {student_id} not found",
                }

            # Save student data for return value before deletion
            student_data = student.to_dict()

            self.db.session.delete(student)
            self.db.session.commit()

            return {
                "success": True,
                "message": f"Student {student_id} deleted successfully",
                "data": student_data,
            }

        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error deleting student {student_id}: {str(e)}")
            return {"success": False, "error": f"Error deleting student: {str(e)}"}

    def search_students(
        self, search_query: str, page: int = 1, per_page: int = 10
    ) -> Dict[str, Any]:
        """
        Search students by name, email or ID

        Args:
            search_query: Search query string
            page: Page number
            per_page: Number of students per page

        Returns:
            Dict with search results
        """
        try:
            search = f"%{search_query}%"
            query = Student.query.filter(
                (Student.user_name.ilike(search))
                | (Student.user_email.ilike(search))
                | (Student.user_id.ilike(search))
            )

            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            students = pagination.items

            return {
                "success": True,
                "data": {
                    "students": [student.to_dict() for student in students],
                    "pagination": {
                        "total": pagination.total,
                        "pages": pagination.pages,
                        "page": page,
                        "per_page": per_page,
                        "has_next": pagination.has_next,
                        "has_prev": pagination.has_prev,
                    },
                },
            }
        except Exception as e:
            current_app.logger.error(f"Error searching students: {str(e)}")
            return {"success": False, "error": f"Error searching students: {str(e)}"}

    def filter_students(
        self, filters: Dict[str, Any], page: int = 1, per_page: int = 10
    ) -> Dict[str, Any]:
        """
        Filter students by various criteria

        Args:
            filters: Dictionary containing filter criteria
            page: Page number
            per_page: Number of students per page

        Returns:
            Dict with filtered results
        """
        try:
            query = Student.query

            # Apply filters
            if filters.get("gender"):
                query = query.filter(Student.user_gender == filters["gender"])

            if filters.get("level"):
                query = query.filter(Student.sd_startlv == filters["level"])

            if filters.get("verified") is not None:
                query = query.filter(Student.is_email_verified == filters["verified"])

            if filters.get("enrolled_after"):
                try:
                    enrolled_after = datetime.strptime(
                        filters["enrolled_after"], "%Y-%m-%d"
                    ).date()
                    query = query.filter(Student.sd_enrollmenttdate >= enrolled_after)
                except ValueError:
                    return {
                        "success": False,
                        "error": "Invalid date format for enrolled_after (use YYYY-MM-DD)",
                    }

            if filters.get("enrolled_before"):
                try:
                    enrolled_before = datetime.strptime(
                        filters["enrolled_before"], "%Y-%m-%d"
                    ).date()
                    query = query.filter(Student.sd_enrollmenttdate <= enrolled_before)
                except ValueError:
                    return {
                        "success": False,
                        "error": "Invalid date format for enrolled_before (use YYYY-MM-DD)",
                    }

            # Apply sorting
            sort_by = filters.get("sort_by", "user_name")
            sort_order = filters.get("sort_order", "asc")

            if hasattr(Student, sort_by):
                if sort_order == "desc":
                    query = query.order_by(getattr(Student, sort_by).desc())
                else:
                    query = query.order_by(getattr(Student, sort_by))

            # Paginate results
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            students = pagination.items

            return {
                "success": True,
                "data": {
                    "students": [student.to_dict() for student in students],
                    "pagination": {
                        "total": pagination.total,
                        "pages": pagination.pages,
                        "page": page,
                        "per_page": per_page,
                        "has_next": pagination.has_next,
                        "has_prev": pagination.has_prev,
                    },
                },
            }
        except Exception as e:
            current_app.logger.error(f"Error filtering students: {str(e)}")
            return {"success": False, "error": f"Error filtering students: {str(e)}"}

    def generate_student_id(self) -> str:
        """
        Generate a new unique student ID

        Returns:
            New student ID
        """
        try:
            last_student = Student.query.order_by(Student.user_id.desc()).first()
            if last_student:
                # Extract number from last ID and increment
                last_id = int(last_student.user_id[1:])
                new_id = f"S{(last_id + 1):08d}"
            else:
                new_id = "S00000001"

            return new_id
        except Exception as e:
            current_app.logger.error(f"Error generating student ID: {str(e)}")
            raise Exception(f"Error generating student ID: {str(e)}")
