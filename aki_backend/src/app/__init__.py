import os
from dotenv import load_dotenv

load_dotenv(os.path.abspath(os.path.join(__file__, "../../.env")))

from flask import Flask
from flask_cors import CORS
from marshmallow import ValidationError

from config import Config
from app.core.generics import Controller
from app.core.database import db
from app.core.serialization import ma
from app.core.localization import set_translations
from app.core.database import load_entities
from app.core.blocklist import jwt, blocklist


def create_app():
    application = Flask(__name__)
    application.config.from_object(Config)

    db.init_app(application)
    ma.init_app(application)
    jwt.init_app(application)
    CORS(application, resources={r"/*": {"origins": "*"}})
    application.config["CORS_HEADER"] = "Content-Type"

    set_translations()
    load_entities()

    from app.core.exceptions import load_handlers

    load_handlers(application, jwt)

    from app.routing.web import web_bp
    application.register_blueprint(web_bp)

    from app.routing.api import api_bp
    application.register_blueprint(api_bp)

    return application


app = create_app()
