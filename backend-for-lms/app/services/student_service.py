from typing import Dict, Any, List, Optional
from sqlalchemy.exc import IntegrityError
from flask import current_app
from app.config import db
from app.models.student_model import Student
from datetime import datetime, date
from werkzeug.security import generate_password_hash
from werkzeug.exceptions import NotFound, BadRequest, Conflict


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
        """
        Create a new student

        Args:
            data: Student data

        Returns:
            Dict with created student data
        """
        try:
            # Validate required fields
            required_fields = ["user_name", "user_email", "user_password"]
            for field in required_fields:
                if field not in data or not data[field]:
                    return {
                        "success": False,
                        "error": f"Missing required field: {field}",
                    }

            # Check if email already exists
            if Student.query.filter_by(user_email=data["user_email"]).first():
                return {"success": False, "error": "Email already exists"}

            # Generate student ID
            last_student = Student.query.order_by(Student.user_id.desc()).first()
            if last_student:
                # Extract number from last ID and increment
                last_id = int(last_student.user_id[1:])
                new_id = f"S{(last_id + 1):08d}"
            else:
                new_id = "S00000001"

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

            # Create student instance
            student_data = {
                "user_id": new_id,
                "user_name": data["user_name"],
                "user_email": data["user_email"],
                "user_gender": data.get("user_gender"),
                "user_birthday": data.get("user_birthday"),
                "user_telephone": data.get("user_telephone"),
                "sd_startlv": data.get("sd_startlv", "BEGINNER"),
                "sd_enrollmenttdate": data.get("sd_enrollmenttdate", date.today()),
                "is_email_verified": data.get("is_email_verified", False),
            }

            student = Student(**student_data)

            # Set password
            if "user_password" in data:
                student.set_password(data["user_password"])

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
            student = Student.query.filter_by(user_id=student_id).first()
            if not student:
                return {
                    "success": False,
                    "error": f"Student with ID {student_id} not found",
                }

            # Update fields if provided
            if "user_name" in data:
                student.user_name = data["user_name"]

            if "user_email" in data:
                # Check if new email already exists
                existing = Student.query.filter(
                    Student.user_email == data["user_email"],
                    Student.user_id != student_id,
                ).first()
                if existing:
                    return {
                        "success": False,
                        "error": "Email already in use by another student",
                    }
                student.user_email = data["user_email"]

            if "user_gender" in data:
                student.user_gender = data["user_gender"]

            if "user_birthday" in data and data["user_birthday"]:
                try:
                    if isinstance(data["user_birthday"], str):
                        student.user_birthday = datetime.strptime(
                            data["user_birthday"], "%Y-%m-%d"
                        ).date()
                    else:
                        student.user_birthday = data["user_birthday"]
                except ValueError:
                    return {
                        "success": False,
                        "error": "Invalid date format for birthday (use YYYY-MM-DD)",
                    }

            if "user_telephone" in data:
                student.user_telephone = data["user_telephone"]

            if "sd_startlv" in data:
                student.sd_startlv = data["sd_startlv"]

            if "sd_enrollmenttdate" in data:
                try:
                    if isinstance(data["sd_enrollmenttdate"], str):
                        student.sd_enrollmenttdate = datetime.strptime(
                            data["sd_enrollmenttdate"], "%Y-%m-%d"
                        ).date()
                    else:
                        student.sd_enrollmenttdate = data["sd_enrollmenttdate"]
                except ValueError:
                    return {
                        "success": False,
                        "error": "Invalid date format for enrollment date (use YYYY-MM-DD)",
                    }

            if "is_email_verified" in data:
                student.is_email_verified = data["is_email_verified"]

            if "user_password" in data and data["user_password"]:
                student.set_password(data["user_password"])

            # Update timestamp
            student.updated_at = datetime.now()

            self.db.session.commit()

            return {
                "success": True,
                "message": "Student updated successfully",
                "data": student.to_dict(),
            }

        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Database integrity error: {str(e)}")
            return {
                "success": False,
                "error": "Database integrity error. Student could not be updated.",
            }
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
