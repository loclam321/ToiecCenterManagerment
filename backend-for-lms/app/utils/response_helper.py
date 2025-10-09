from flask import jsonify
from datetime import datetime


class ResponseHelper:
    """Class helper cho response API"""
    
    @staticmethod
    def success(data=None, pagination=None, message="Success"):
        """Tạo response thành công"""
        return success_response(data, pagination, message)
    
    @staticmethod
    def error(message="An error occurred", details=None):
        """Tạo response lỗi"""
        return error_response(message, details)
    
    @staticmethod
    def created(data=None, message="Created successfully"):
        """Tạo response tạo mới thành công"""
        return created_response(data, message)
    
    @staticmethod
    def not_found(message="Resource not found"):
        """Tạo response không tìm thấy"""
        return not_found_response(message)
    
    @staticmethod
    def validation_error(errors):
        """Tạo response lỗi validation"""
        return validation_error_response(errors)


def success_response(data=None, pagination=None, message="Success"):
    """Tạo response thành công"""
    response_data = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response_data["data"] = data
    
    if pagination is not None:
        response_data["pagination"] = pagination
    
    return jsonify(response_data)


def error_response(message="An error occurred", details=None):
    """Tạo response lỗi"""
    response_data = {
        "success": False,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if details:
        response_data["details"] = details
    
    return jsonify(response_data)


def created_response(data=None, message="Created successfully"):
    """Tạo response tạo mới thành công với status code 201"""
    response_data = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response_data["data"] = data
    
    response = jsonify(response_data)
    response.status_code = 201
    return response


def validation_error_response(errors):
    """Tạo response lỗi validation"""
    response_data = {
        "success": False,
        "message": "Validation failed",
        "errors": errors,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return jsonify(response_data)


def not_found_response(message="Resource not found"):
    """Tạo response không tìm thấy"""
    response_data = {
        "success": False,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return jsonify(response_data)
