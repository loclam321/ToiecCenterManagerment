from flask import Flask
from flask_cors import CORS
from app.config import db, migrate, jwt, config


def create_app(config_name="default"):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize CORS
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Import models (để Flask-Migrate detect được)
    from app.models.course_model import Course

    # Register blueprints
    from .routes import main
    from .teacher_route import teacher_bp

    app.register_blueprint(main)
    app.register_blueprint(teacher_bp)

    return app
