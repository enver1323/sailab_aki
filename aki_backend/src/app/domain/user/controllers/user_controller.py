from flask import request
from app.core.exceptions import InternalError
from app.core.generics import Controller, ListController
from app.core.localization import gettext
from app.domain.user.entities.user import User
from app.domain.user.schemas.user_schema import UserSchema, UserUpdateSchema, UserCreateSchema
from app.domain.user.services.user_service import UserService
from app.core.view_decorators import admin_required

user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_update_schema = UserUpdateSchema()


class UserList(ListController):
    @classmethod
    @admin_required()
    def get(cls):
        page, per_page = cls.get_paginator_args()
        search = request.args.get('search', None, type=str)
        users_query = User.query
        if search:
            users_query = users_query.filter(
                User.username.ilike(f"%{search}%") |
                User.name.ilike(f"%{search}%") | 
                User.external_id.ilike(f"%{search}%")
            )
        users = users_query.paginate(page=page, per_page=per_page)

        paginator_data = cls.prepare_paginator_response(users, user_schema)
        return cls.response(200, data=paginator_data)

    @classmethod
    @admin_required()
    def post(cls):
        request_json = request.get_json()
        data = user_create_schema.load(request_json)

        try:
            user = UserService.create(data)
        except InternalError as err:
            return cls.response(500, err.message)

        message = gettext("user.created", username=user.username)
        return cls.response(200, message, user_schema.dump(user))


class UserProfile(Controller):
    @classmethod
    @admin_required()
    def get(cls, user_id: int):
        user = User.find_by_id(user_id)

        if user is None:
            return cls.response(404)

        return cls.response(data=user_schema.dump(user))
    
    @classmethod
    @admin_required()
    def put(cls, user_id: int):
        request_json = request.get_json()
        user = User.find_by_id(user_id)
        data = user_update_schema.load({
            **request_json,
            "user_id": user_id
        })

        try:
            user = UserService.update(user, data)
        except InternalError as err:
            return cls.response(500, err.message)

        message = gettext("user.updated", username=user.username)
        return cls.response(200, message, user_schema.dump(user))

    @classmethod
    @admin_required()
    def delete(cls, user_id: int):
        try:
            UserService.delete(user_id)
        except InternalError as err:
            return cls.response(500, err.message)

        return cls.response(204, gettext("user.deleted"))
