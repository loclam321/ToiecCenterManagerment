import re
from typing import Dict, Any, List, Optional


class Validator:
    """Class chứa các validation functions"""

    def __init__(self):
        self.errors = {}

    def require(self, field_name, value, message):
        """Kiểm tra field bắt buộc"""
        if not value or (isinstance(value, str) and not value.strip()):
            self.errors[field_name] = message
        return self

    def integer(self, field_name, value, message, min_val=None, max_val=None):
        """Kiểm tra số nguyên"""
        if value is not None:
            try:
                val = int(value)
                if min_val is not None and val < min_val:
                    self.errors[field_name] = f"{message} (minimum: {min_val})"
                elif max_val is not None and val > max_val:
                    self.errors[field_name] = f"{message} (maximum: {max_val})"
            except (ValueError, TypeError):
                self.errors[field_name] = message
        return self

    def add_error(self, field_name, message):
        """Thêm lỗi thủ công"""
        self.errors[field_name] = message
        return self

    def is_valid(self):
        """Kiểm tra có lỗi không"""
        return len(self.errors) == 0

    @staticmethod
    def validate_required_fields(
        data: Dict[str, Any], required_fields: List[str]
    ) -> Dict[str, Any]:
        """Validate các field bắt buộc"""
        errors = {}

        if not data:
            return {"valid": False, "errors": {"data": "Request data is required"}}

        for field in required_fields:
            if (
                field not in data
                or data[field] is None
                or str(data[field]).strip() == ""
            ):
                errors[field] = f"{field} is required"

        return {"valid": len(errors) == 0, "errors": errors}

    @staticmethod
    def validate_string_length(
        value: str,
        field_name: str,
        min_length: int = 0,
        max_length: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Validate độ dài string"""
        if not isinstance(value, str):
            return {"valid": False, "error": f"{field_name} must be a string"}

        value = value.strip()

        if len(value) < min_length:
            return {
                "valid": False,
                "error": f"{field_name} must be at least {min_length} characters",
            }

        if max_length and len(value) > max_length:
            return {
                "valid": False,
                "error": f"{field_name} must not exceed {max_length} characters",
            }

        return {"valid": True}

    @staticmethod
    def validate_email(email: str) -> Dict[str, Any]:
        """Validate email format"""
        if not email:
            return {"valid": False, "error": "Email is required"}

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

        if not re.match(pattern, email.strip()):
            return {"valid": False, "error": "Invalid email format"}

        return {"valid": True}

    @staticmethod
    def validate_course_id(course_id: str) -> Dict[str, Any]:
        """Validate course ID format"""
        if not course_id:
            return {"valid": False, "error": "Course ID is required"}

        course_id = course_id.strip()

        # Validate length
        if len(course_id) > 10:
            return {"valid": False, "error": "Course ID must not exceed 10 characters"}

        if len(course_id) < 1:
            return {"valid": False, "error": "Course ID cannot be empty"}

        # Validate format (alphanumeric + underscore + dash)
        if not re.match(r"^[a-zA-Z0-9_-]+$", course_id):
            return {
                "valid": False,
                "error": "Course ID can only contain letters, numbers, underscore and dash",
            }

        return {"valid": True}

    @staticmethod
    def validate_status(status: str, valid_statuses: List[str]) -> Dict[str, Any]:
        """Validate status value"""
        if not status:
            return {"valid": False, "error": "Status is required"}

        if status not in valid_statuses:
            return {
                "valid": False,
                "error": f"Status must be one of: {', '.join(valid_statuses)}",
            }

        return {"valid": True}

    @staticmethod
    def validate_course_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate course data comprehensively"""
        errors = {}

        # Required fields validation
        required_validation = Validator.validate_required_fields(
            data, ["course_id", "course_name"]
        )
        if not required_validation["valid"]:
            errors.update(required_validation["errors"])

        # Course ID validation
        if "course_id" in data and data["course_id"]:
            course_id_validation = Validator.validate_course_id(data["course_id"])
            if not course_id_validation["valid"]:
                errors["course_id"] = course_id_validation["error"]

        # Course name validation
        if "course_name" in data and data["course_name"]:
            name_validation = Validator.validate_string_length(
                data["course_name"], "course_name", min_length=1, max_length=100
            )
            if not name_validation["valid"]:
                errors["course_name"] = name_validation["error"]

        # Course description validation (optional)
        if "course_description" in data and data["course_description"]:
            desc_validation = Validator.validate_string_length(
                data["course_description"], "course_description", max_length=1000
            )
            if not desc_validation["valid"]:
                errors["course_description"] = desc_validation["error"]

        # Course status validation (optional)
        if "course_status" in data and data["course_status"]:
            status_validation = Validator.validate_status(
                data["course_status"], ["ACTIVE", "INACTIVE", "DRAFT"]
            )
            if not status_validation["valid"]:
                errors["course_status"] = status_validation["error"]

        return {"valid": len(errors) == 0, "errors": errors}

    @staticmethod
    def validate_update_course_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate course data cho update (không bắt buộc course_id)"""
        errors = {}

        if not data:
            return {"valid": False, "errors": {"data": "No data provided for update"}}

        # Course name validation nếu có
        if "course_name" in data:
            if not data["course_name"] or str(data["course_name"]).strip() == "":
                errors["course_name"] = "course_name cannot be empty"
            else:
                name_validation = Validator.validate_string_length(
                    data["course_name"], "course_name", min_length=1, max_length=100
                )
                if not name_validation["valid"]:
                    errors["course_name"] = name_validation["error"]

        # Course description validation nếu có
        if "course_description" in data and data["course_description"]:
            desc_validation = Validator.validate_string_length(
                data["course_description"], "course_description", max_length=1000
            )
            if not desc_validation["valid"]:
                errors["course_description"] = desc_validation["error"]

        # Course status validation nếu có
        if "course_status" in data and data["course_status"]:
            status_validation = Validator.validate_status(
                data["course_status"], ["ACTIVE", "INACTIVE", "DRAFT"]
            )
            if not status_validation["valid"]:
                errors["course_status"] = status_validation["error"]

        return {"valid": len(errors) == 0, "errors": errors}

    @staticmethod
    def validate_search_keyword(keyword: str) -> Dict[str, Any]:
        """Validate search keyword"""
        if not keyword or keyword.strip() == "":
            return {"valid": False, "error": "Search keyword is required"}

        keyword = keyword.strip()

        if len(keyword) < 2:
            return {
                "valid": False,
                "error": "Search keyword must be at least 2 characters",
            }

        if len(keyword) > 100:
            return {
                "valid": False,
                "error": "Search keyword must not exceed 100 characters",
            }

        return {"valid": True, "keyword": keyword}

    @staticmethod
    def validate_pagination(page: Any, per_page: Any) -> Dict[str, Any]:
        """Validate pagination parameters"""
        errors = {}

        # Validate page
        try:
            page = int(page) if page else 1
            if page < 1:
                errors["page"] = "Page must be greater than 0"
        except (ValueError, TypeError):
            errors["page"] = "Page must be a valid integer"
            page = 1

        # Validate per_page
        try:
            per_page = int(per_page) if per_page else 10
            if per_page < 1:
                errors["per_page"] = "Per page must be greater than 0"
            elif per_page > 100:
                errors["per_page"] = "Per page must not exceed 100"
        except (ValueError, TypeError):
            errors["per_page"] = "Per page must be a valid integer"
            per_page = 10

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "page": page,
            "per_page": per_page,
        }

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format"""
        if not phone:
            return False

        # Vietnamese phone number pattern
        pattern = r"^(0[3|5|7|8|9])[0-9]{8}$"
        return bool(re.match(pattern, phone.strip()))

    @staticmethod
    def validate_teacher_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate teacher data comprehensively"""
        errors = {}

        # Required fields validation
        required_validation = Validator.validate_required_fields(
            data, ["user_name", "user_email", "user_password"]
        )
        if not required_validation["valid"]:
            errors.update(required_validation["errors"])

        # Email validation
        if "user_email" in data and data["user_email"]:
            email_validation = Validator.validate_email(data["user_email"])
            if not email_validation["valid"]:
                errors["user_email"] = email_validation["error"]

        # Phone validation
        if "user_telephone" in data and data["user_telephone"]:
            if not Validator.validate_phone(data["user_telephone"]):
                errors["user_telephone"] = "Invalid phone number format"

        # Name validation
        if "user_name" in data and data["user_name"]:
            name_validation = Validator.validate_string_length(
                data["user_name"], "user_name", min_length=2, max_length=100
            )
            if not name_validation["valid"]:
                errors["user_name"] = name_validation["error"]

        # Password validation
        if "user_password" in data and data["user_password"]:
            password_validation = Validator.validate_string_length(
                data["user_password"], "user_password", min_length=6, max_length=50
            )
            if not password_validation["valid"]:
                errors["user_password"] = password_validation["error"]

        # Gender validation
        if "user_gender" in data and data["user_gender"]:
            if data["user_gender"] not in ["M", "F"]:
                errors["user_gender"] = "Gender must be M or F"

        return {"valid": len(errors) == 0, "errors": errors}
