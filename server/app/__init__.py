from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
from config import config
from app.models import Base
from app.database.db import engine
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.courses import courses_bp
from app.routes.exercises import exercises_bp
from app.routes.rankings import rankings_bp
from app.routes.errors import errors_bp
from app.routes.sandbox import sandbox_bp
import os

db = SQLAlchemy()
jwt = JWTManager()
Base.metadata.create_all(engine)

def create_app():
    env_name = os.getenv('FLASK_ENV', 'development')
    if env_name not in config:
        env_name = 'development'
    app = Flask(__name__)
    app.config.from_object(config[env_name])
    for key, value in config[env_name].__dict__.items():
        if not key.startswith('__'):
            print(f"{key}: {value}")
    print(f"Starting app in {env_name} environment.")
    CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:8888", "http://127.0.0.1:5000", "http://se-fall25.noyce.calpoly.io", "https://assistants.polito.it"])

    # Initialize extensions
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(courses_bp, url_prefix='/courses')
    app.register_blueprint(exercises_bp, url_prefix='/courses')
    app.register_blueprint(rankings_bp, url_prefix='/courses')
    app.register_blueprint(errors_bp, url_prefix='/errors')
    app.register_blueprint(sandbox_bp, url_prefix='/sandbox')
    # Swagger
    SWAGGER_URL = app.config['SWAGGER_URL']
    API_URL = app.config['API_URL']
    swagger_ui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
    app.register_blueprint(swagger_ui_blueprint, url_prefix=SWAGGER_URL)
    
    return app
