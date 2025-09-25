from flask import Flask
from app.config import db, migrate, jwt, mail, config
from .routes.auth_route import auth_bp
from flask_cors import CORS


def create_app(config_name="default"):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Cấu hình CORS đầy đủ hơn
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5175",
                    "http://localhost:5176",
                    "http://localhost:5177",
                ],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            }
        },
        supports_credentials=True,
    )

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Import models (để Flask-Migrate detect được)
    from app.models.course_model import Course

    app.register_blueprint(auth_bp)

    return app
