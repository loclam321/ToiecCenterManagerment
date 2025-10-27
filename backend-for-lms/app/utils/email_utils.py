import jwt
from datetime import datetime, timedelta
from flask import current_app, render_template
from flask_mail import Message
from app.config import mail


def generate_email_verification_token(user_id, data):
    """
    Tạo JWT token cho xác minh email (stateless)

    Args:
        user_id: ID của user cần xác minh

    Returns:
        str: JWT token
    """
    payload = {
        "user_id": user_id,
        "purpose": "email_verification",  # Mục đích sử dụng
        "data": data,
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


def send_password_to_student(to_email, student_name, password):
    """
    Gửi email chứa mật khẩu cho học viên mới đăng ký.

    Args:
        to_email (str): Email của học viên.
        student_name (str): Tên học viên.
        password (str): Mật khẩu cần gửi.
    """
    from flask import current_app

    subject = "Thông tin tài khoản LMS của bạn"
    html_content = f"""
        <h2>Chào {student_name},</h2>
        <p>Bạn đã được đăng ký tài khoản trên hệ thống LMS.</p>
        <p><strong>Tài khoản đăng nhập:</strong> {to_email}</p>
        <p><strong>Mật khẩu:</strong> {password}</p>
        <p>Vui lòng đăng nhập và đổi mật khẩu sau khi đăng nhập lần đầu.</p>
        <p>Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.</p>
    """

    msg = Message(
        subject=subject,
        recipients=[to_email],
        html=html_content,
    )

    mail.send(msg)


def send_verification_email(to_email, token):
    """Gửi email xác minh cho người dùng mới"""
    from flask import current_app

    verification_url = f"{current_app.config.get('BASE_URL', 'http://localhost:5000')}/api/consult-registrations/verify-email/{token}"

    subject = "Xác minh tài khoản LMS của bạn"

    # Nếu bạn có template
    # return send_email(to_email, subject, 'emails/verify_email.html', verification_url=verification_url)

    # Hoặc gửi trực tiếp
    msg = Message(
        subject=subject,
        recipients=[to_email],
        html=f"""
        <h2>Xác minh tài khoản của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống LMS.</p>
        <p>Vui lòng nhấn vào <a href="{verification_url}">liên kết này</a> để xác minh tài khoản.</p>
        <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
        <p>Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.</p>
        """,
    )

    mail.send(msg)
