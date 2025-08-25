from typing import Optional
from flask import Flask
from flask_jwt_extended import (
    JWTManager,
    get_jwt,
    get_jwt_identity,
    create_access_token,
    set_access_cookies,
)
from marshmallow import ValidationError
from datetime import datetime, timezone, timedelta

from app.core.generics import Controller
from app.core.localization import gettext


class InsufficientRightsError(Exception):
    def __init__(self, message: Optional[str] = None):
        self.message = message


class InternalError(BaseException):
    def __init__(self, message: str):
        self.message = message


def load_handlers(app: Flask, jwt: JWTManager) -> None:
    @app.errorhandler(ValidationError)
    def handle_marshmallow_validation(err: ValidationError):
        return Controller.response(
            400, gettext("errors.validation"), errors=err.messages
        )

    @app.errorhandler(InsufficientRightsError)
    def handle_insufficient_rights_error(err: InsufficientRightsError):
        return Controller.response(
            403, err.message or gettext("errors.insufficientRights")
        )

    @app.errorhandler(404)
    def handle_not_found_with_frontend(e):
        return app.send_static_file("dist/index.html")

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return Controller.response(401, gettext("errors.token_expired"))

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return Controller.response(401, gettext("errors.token_revoked"))
