from flask import Flask
from app.config import db, migrate, jwt, mail, config
from .routes.auth_route import auth_bp
from flask_cors import CORS
from .routes.teacher_route import teacher_bp
from .routes.course_route import course_bp
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url


def _ensure_database_exists(database_uri: str) -> None:
    """Create target database if missing (MySQL) using same credentials."""
    try:
        url = make_url(database_uri)
        database_name = url.database
        if not database_name:
            return
        server_db = 'mysql' if url.drivername.startswith('mysql') else None
        server_url = url.set(database=server_db)
        engine = create_engine(server_url)
        with engine.connect() as conn:
            conn.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{database_name}` "
                    "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )
        engine.dispose()
    except Exception:
        # Ignore and let normal initialization surface errors
        pass

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

    # Ensure database exists before initializing extensions
    _ensure_database_exists(config[config_name].SQLALCHEMY_DATABASE_URI)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Import models (để Flask-Migrate detect được)
    from app.models.course_model import Course

    app.register_blueprint(auth_bp)
    app.register_blueprint(teacher_bp)
    app.register_blueprint(course_bp)
    return app
