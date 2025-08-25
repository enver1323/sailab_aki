from flask_jwt_extended import create_access_token, create_refresh_token
from typing import Tuple

from app.core.database import db
from app.domain.user.entities.user import User
from app.domain.user.entities.department import Department
from app.core.exceptions import InternalError


class UserService:
    @classmethod
    def login(cls, user_id: int, fresh: bool = True) -> Tuple[str, str]:
        access_token = create_access_token(identity=user_id, fresh=fresh)
        refresh_token = create_refresh_token(user_id)
        return access_token, refresh_token

    @classmethod
    def create(cls, data: dict) -> User:
        departments = data.pop('departments', None)
        try:
            user = User(**data)
            user.flush()
            if departments is not None:
                user.departments = Department.query.filter(
                    Department.id.in_(departments)).all()
                user.flush()

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise InternalError(str(e))

        return user

    @classmethod
    def update(cls, user: User, data: dict) -> User:
        departments = data.pop('departments', None)
        password = data.pop('password', None)
        if password is not None:
            data['password'] = password
        try:
            user.fill(data)
            user.flush()
            if departments is not None:
                user.departments = Department.query.filter(
                    Department.id.in_(departments)).all()
                user.flush()

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise InternalError(str(e))

        return user

    @classmethod
    def find_or_new_by_external(cls, external_id: str) -> User:
        user = User.find_by_external_id(external_id)
        if user is None:
            user = cls.new_from_external(external_id)
        return user

    @classmethod
    def new_from_external(cls, external_id: str) -> User:
        return User(external_id, external_id, external_id=external_id)
