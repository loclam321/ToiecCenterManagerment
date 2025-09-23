from flask import jsonify
from functools import wraps
import traceback
import logging
from .response_helper import ResponseHelper


class ErrorHandler:
    """Class để xử lý errors và exceptions"""
    
    @staticmethod
    def handle_database_error(func):
        """Decorator để xử lý database errors"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Log error
                logging.error(f"Database error in {func.__name__}: {str(e)}")
                logging.error(traceback.format_exc())
                
                # Rollback nếu có
                try:
                    from app.config import db
                    db.session.rollback()
                except:
                    pass
                
                return ResponseHelper.error(
                    message="Database operation failed",
                    status_code=500,
                    error_code="DATABASE_ERROR"
                )
        return wrapper
    
    @staticmethod
    def handle_validation_error(func):
        """Decorator để xử lý validation errors"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except ValueError as e:
                return ResponseHelper.validation_error(
                    message=str(e),
                    errors={"validation": str(e)}
                )
            except Exception as e:
                logging.error(f"Validation error in {func.__name__}: {str(e)}")
                return ResponseHelper.error(
                    message="Validation failed",
                    status_code=400,
                    error_code="VALIDATION_ERROR"
                )
        return wrapper
    
    @staticmethod
    def handle_service_error(func):
        """Decorator tổng quát để xử lý service errors"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                
                # Nếu service trả về dict với success field
                if isinstance(result, dict) and 'success' in result:
                    if not result['success']:
                        status_code = result.get('status_code', 500)
                        return {
                            "success": False,
                            "message": result.get('error', 'Service error'),
                            "status_code": status_code,
                            "error_code": result.get('error_code')
                        }
                
                return result
                
            except Exception as e:
                logging.error(f"Service error in {func.__name__}: {str(e)}")
                logging.error(traceback.format_exc())
                
                return {
                    "success": False,
                    "message": "Internal service error",
                    "status_code": 500,
                    "error_code": "SERVICE_ERROR"
                }
        return wrapper
    
    @staticmethod
    def handle_not_found_error(func):
        """Decorator để xử lý not found errors"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                
                # Kiểm tra nếu kết quả None hoặc empty
                if result is None:
                    return {
                        "success": False,
                        "message": "Resource not found",
                        "status_code": 404,
                        "error_code": "NOT_FOUND"
                    }
                
                return result
                
            except Exception as e:
                logging.error(f"Not found error in {func.__name__}: {str(e)}")
                return {
                    "success": False,
                    "message": "Resource not found",
                    "status_code": 404,
                    "error_code": "NOT_FOUND"
                }
        return wrapper


# Decorator functions để sử dụng trực tiếp
def handle_errors(func):
    """Decorator tổng quát để handle tất cả errors"""
    return ErrorHandler.handle_service_error(
        ErrorHandler.handle_database_error(
            ErrorHandler.handle_validation_error(func)
        )
    )

def handle_database_errors(func):
    """Decorator chỉ handle database errors"""
    return ErrorHandler.handle_database_error(func)

def handle_validation_errors(func):
    """Decorator chỉ handle validation errors"""
    return ErrorHandler.handle_validation_error(func)

def handle_not_found_errors(func):
    """Decorator chỉ handle not found errors"""
    return ErrorHandler.handle_not_found_error(func)