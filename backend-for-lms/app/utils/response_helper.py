from flask import jsonify
from typing import Any, Dict, Optional, Union
from datetime import datetime


class ResponseHelper:
    """Helper class để tạo response chuẩn cho API"""

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = 200,
        meta: Optional[Dict] = None,
    ) -> tuple:
        """
        Tạo success response

        Args:
            data: Dữ liệu trả về
            message: Thông báo
            status_code: HTTP status code
            meta: Metadata bổ sung (pagination, count, etc.)

        Returns:
            tuple: (response, status_code)
        """
        response = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if meta:
            response["meta"] = meta

        return jsonify(response), status_code

    @staticmethod
    def error(
        message: str = "An error occurred",
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict] = None,
    ) -> tuple:
        """
        Tạo error response

        Args:
            message: Thông báo lỗi
            status_code: HTTP status code
            error_code: Mã lỗi tùy chỉnh
            details: Chi tiết lỗi

        Returns:
            tuple: (response, status_code)
        """
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if error_code:
            response["error_code"] = error_code

        if details:
            response["details"] = details

        return jsonify(response), status_code

    @staticmethod
    def created(
        data: Any,
        message: str = "Resource created successfully",
        location: Optional[str] = None,
    ) -> tuple:
        """Tạo response cho resource được tạo mới"""
        response = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if location:
            response["location"] = location

        return jsonify(response), 201

    @staticmethod
    def not_found(
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
    ) -> tuple:
        """Tạo response cho resource không tìm thấy"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if resource_type and resource_id:
            response["details"] = {
                "resource_type": resource_type,
                "resource_id": resource_id,
            }

        return jsonify(response), 404

    @staticmethod
    def validation_error(
        message: str = "Validation failed", errors: Optional[Dict] = None
    ) -> tuple:
        """Tạo response cho lỗi validation"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if errors:
            response["validation_errors"] = errors

        return jsonify(response), 400

    @staticmethod
    def forbidden(
        message: str = "Access forbidden", reason: Optional[str] = None
    ) -> tuple:
        """Tạo response cho lỗi forbidden"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if reason:
            response["reason"] = reason

        return jsonify(response), 403

    @staticmethod
    def conflict(
        message: str = "Resource conflict",
        conflict_field: Optional[str] = None,
        conflict_value: Optional[str] = None,
    ) -> tuple:
        """Tạo response cho lỗi conflict"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if conflict_field and conflict_value:
            response["conflict"] = {"field": conflict_field, "value": conflict_value}

        return jsonify(response), 409

    @staticmethod
    def paginated_response(
        data: list, page: int, per_page: int, total: int, message: str = "Success"
    ) -> tuple:
        """Tạo response với pagination"""
        total_pages = (total + per_page - 1) // per_page

        meta = {
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            }
        }

        return ResponseHelper.success(data=data, message=message, meta=meta)


# Convenience functions cho sử dụng nhanh
def success_response(data=None, message="Success", status_code=200, meta=None):
    """Shorthand cho success response"""
    return ResponseHelper.success(data, message, status_code, meta)


def error_response(
    message="An error occurred", status_code=500, error_code=None, details=None
):
    """Shorthand cho error response"""
    return ResponseHelper.error(message, status_code, error_code, details)


def created_response(data, message="Resource created successfully", location=None):
    """Shorthand cho created response"""
    return ResponseHelper.created(data, message, location)


def not_found_response(
    message="Resource not found", resource_type=None, resource_id=None
):
    """Shorthand cho not found response"""
    return ResponseHelper.not_found(message, resource_type, resource_id)


def validation_error_response(message="Validation failed", errors=None):
    """Shorthand cho validation error response"""
    return ResponseHelper.validation_error(message, errors)
