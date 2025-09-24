import jwt
from datetime import datetime, timedelta
from flask import current_app, render_template
from flask_mail import Message


def generate_email_verification_token(user_id):
    """
    Tạo JWT token cho xác minh email (stateless)

    Args:
        user_id: ID của user cần xác minh

    Returns:
        str: JWT token
    """
    payload = {
        "user_id": user_id,
        "purpose": "email_verification",  # Mục đích sử dụng token
        "iat": datetime.utcnow(),  # Thời điểm tạo
        "exp": datetime.utcnow() + timedelta(hours=24),  # Hết hạn sau 24h
    }

    token = jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

    return token


def verify_email_token(token):
    """
    Xác thực JWT token

    Args:
        token: JWT token cần xác thực

    Returns:
        dict: Thông tin từ token nếu hợp lệ
        None: Nếu token không hợp lệ hoặc hết hạn
    """
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
        )

        # Kiểm tra mục đích sử dụng token
        if payload.get("purpose") != "email_verification":
            return None

        return payload
    except jwt.ExpiredSignatureError:
        # Token hết hạn
        return None
    except jwt.InvalidTokenError:
        # Token không hợp lệ
        return None


def send_verification_email(mail, to_email, user_id):
    """Gửi email xác minh cho người dùng mới"""
    # Tạo JWT token
    token = generate_email_verification_token(user_id)

    # URL xác minh với token
    verification_url = f"{current_app.config.get('BASE_URL', 'http://localhost:5000')}/api/auth/verify-email/{token}"

    subject = "Xác minh tài khoản LMS của bạn"

    html_body = f"""
    <h2>Xác minh tài khoản của bạn</h2>
    <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống LMS.</p>
    <p>Vui lòng nhấn vào <a href="{verification_url}">liên kết này</a> để xác minh tài khoản.</p>
    <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
    <p>Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.</p>
    """

    msg = Message(subject=subject, recipients=[to_email], html=html_body)

    mail.send(msg)
