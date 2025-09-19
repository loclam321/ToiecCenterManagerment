from flask import Flask
from app.config import db, migrate, jwt, config


def create_app(config_name="default"):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Import models (để Flask-Migrate detect được)
    from app.models.course_model import Course

    # Register blueprints
    from .routes import main

    app.register_blueprint(main)

    return app
