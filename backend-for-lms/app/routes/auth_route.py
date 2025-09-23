from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_service = AuthService()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
    
    result = auth_service.login(email, password)
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify(result), 401

@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    result = auth_service.register_student(data)
    
    if result["success"]:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@auth_bp.route('/register/teacher', methods=['POST']) 
def register_teacher():
    data = request.get_json()
    result = auth_service.register_teacher(data)
    
    if result["success"]:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({"success": False, "error": "Token is required"}), 400
    
    result = auth_service.refresh_token(token)
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify(result), 401

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    data = request.get_json()
    user_id = data.get('user_id')
    role = data.get('role')
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not all([user_id, role, old_password, new_password]):
        return jsonify({"success": False, "error": "All fields are required"}), 400
    
    result = auth_service.change_password(user_id, role, old_password, new_password)
    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify(result), 400