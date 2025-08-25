from marshmallow import fields, post_load
from marshmallow.validate import Length

from app import ma
from app.core.validators import Unique, Exists, RulesOrNone
from app.domain.user.entities.user import User, UserRoles
from app.domain.user.entities.department import Department
from app.domain.user.schemas.department_schema import DepartmentSchema


class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User

    id = fields.Int(dump_only=True)
    name = fields.String(required=True, validate=[Length(min=1, max=255)])
    username = fields.String(required=True, validate=[
        Length(min=1, max=50),
        Unique(entity=User, field='username')
    ])
    password = fields.String(required=True, validate=[
        Length(min=6, max=36)
    ], load_only=True)
    role = fields.Enum(UserRoles, required=True)
    external_id = fields.String(
        allow_none=True, validate=[RulesOrNone(Length(min=1, max=255))]
    )
    access_token = fields.String(dump_only=True)
    refresh_token = fields.String(dump_only=True)
    departments = fields.Nested(DepartmentSchema, many=True)


class UserCreateSchema(UserSchema):
    departments = fields.List(fields.Integer(required=True, validate=[
        Exists(entity=Department, field="id")
    ]), load_only=True)


class UserUpdateSchema(UserCreateSchema):
    user_id = fields.Int(
        load_only=True, validate=[Exists(entity=User, field='id')]
    )
    username = fields.String(required=True, validate=[Length(min=1, max=50)])
    password = fields.String(allow_none=True, validate=[
        RulesOrNone(Length(min=6, max=36))
    ], load_only=True)

    @post_load(pass_original=True)
    def validate_username(self, data, original_data, **_):
        rule = Unique(
            entity=User, field='username', except_key=original_data['user_id']
        )
        data['username'] = rule(data['username'])

        return data


class LoginSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User

    username = fields.String(required=True, validate=[
        Length(min=1, max=50),
        Exists(entity=User, field='username')
    ])
    password = fields.String(required=True, validate=[
        Length(min=6, max=36)
    ], load_only=True)
