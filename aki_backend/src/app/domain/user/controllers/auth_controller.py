from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import EXCLUDE
from app.core.constants import APIItems
from app.core.exceptions import InternalError
from app.core.generics import Controller
from app.core.blocklist import blocklist
from app.core.localization import gettext
from app.domain.user.entities.user import User
from app.domain.user.schemas.user_schema import UserSchema, LoginSchema
from app.domain.user.services.user_service import UserService
from flask import current_app
import json

user_schema = UserSchema()
login_schema = LoginSchema()


class TokenGenerator:
    @classmethod
    def _get_formatted_user_response(cls, user: User, fresh: bool = True):
        access_token, refresh_token = UserService.login(user.id, fresh)
        user.access_token = access_token
        user.refresh_token = refresh_token
        return user_schema.dump(user)


class AuthLogin(Controller, TokenGenerator):
    @classmethod
    def post(cls):
        request_json = request.get_json()
        data = login_schema.load(request_json)

        user = User.find_by_username(data.get("username", None))

        if user and user.check_password(data.get("password", None)):
            return cls.response(200, data=cls._get_formatted_user_response(user))

        return cls.response(401, gettext("auth.failed"))


class AuthRegister(Controller, TokenGenerator):
    @classmethod
    def post(cls):
        request_json = request.get_json()
        data = user_schema.load(request_json, unknown=EXCLUDE)

        try:
            user = UserService.create(data)
        except InternalError as err:
            return cls.response(500, err.message)

        return cls.response(201, gettext("user.created", username=user.username), cls._get_formatted_user_response(user))


class AuthLogout(Controller):
    @classmethod
    @jwt_required()
    def post(cls):
        jti = get_jwt()["jti"]
        user_id = get_jwt_identity()
        blocklist.add(jti)
        return cls.response(message=gettext("user.logout").format(user_id))


class AuthRefresh(Controller, TokenGenerator):
    @classmethod
    @jwt_required(refresh=True)
    def post(cls):
        user = User.find_by_id(get_jwt_identity())
        return cls.response(data=cls._get_formatted_user_response(user, False))
