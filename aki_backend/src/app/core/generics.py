from abc import ABC, abstractmethod
from typing import Optional

from flask import request
from flask_restx import Resource
from flask_sqlalchemy.pagination import Pagination
from flask_sqlalchemy.query import Query as BaseQuery
from sqlalchemy.orm.session import Session
from sqlalchemy import inspect


from app.core.localization import gettext
from app.core.constants import APIItems
from app.core.database import db


class Entity(db.Model):
    __abstract__ = True

    def add(self, session: Optional[Session] = db.session):
        session.add(self)

    def save(self, session: Optional[Session] = db.session) -> None:
        self.add(session)
        session.commit()

    def flush(self, session: Optional[Session] = db.session) -> None:
        self.add(session)
        session.flush()

    def delete(self, session: Optional[Session] = None) -> None:
        session.delete(self)
        session.commit()

    def fill(self, data: dict) -> None:
        for column, value in data.items():
            setattr(self, column, value)

    @classmethod
    def get_registry_table_model_dict(cls):
        return {model.__table__.name: model for (_, model) in Entity.registry._class_registry.items() if hasattr(model, '__table__')}

    @classmethod
    def get_primary_key(cls):
        return inspect(cls).primary_key

    def has_related(self, relation, related: "Entity"):
        related_keys = [(key, getattr(related, key.name))
                        for key in related.get_primary_key()]
        own_primary_key_vals = [getattr(related, key.name)
                                for key in related.get_primary_key()]
        exist = all(own_primary_key_vals) and all(
            [val is not None for _, val in related_keys])

        if exist:
            query = getattr(self, relation)
            for key, val in related_keys:
                query = query.filter(key == val)

            return bool(query.count())

        return False
    
    def to_dict(self) -> dict:
        return {field.name: getattr(self, field.name) for field in self.__table__.columns}



class Query(BaseQuery):
    def __init__(self, *args, **kwargs):
        super(Query, self).__init__(*args, **kwargs)

        self.models = self._get_models()

    def _get_models(self, table_name: Optional[str] = None):
        model_dict = Entity.get_registry_table_model_dict()
        if table_name is not None:
            return [model_dict[table_name]]

        models = []
        for table in self._raw_columns:
            if table.name in model_dict:
                models.append(model_dict[table.name])

        return models


class Column(db.Column):
    cache_ok = True
    inherit_cache = True

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('nullable', False)
        super().__init__(*args, **kwargs)

class Seeder(ABC):
    @classmethod
    @abstractmethod
    def seed(cls):
        pass


class Controller(Resource):
    @classmethod
    def response(cls, code: int = 200, message: str = gettext('success'), data=None, errors=None):
        return {
            APIItems.MESSAGE.value: message,
            APIItems.DATA.value: data,
            APIItems.ERRORS.value: errors,
        }, code


class ListController(Controller):
    @classmethod
    def get_paginator_args(cls, page: int = 1, per_page: int = 25):
        arguments = request.args
        page = arguments.get('page', page, type=int)
        per_page = arguments.get('per_page', per_page, type=int)

        return page, per_page

    @classmethod
    def prepare_paginator_response(cls, paginator: Pagination, schema) -> dict:
        return {
            APIItems.PAGINATION.value: {
                APIItems.TOTAL.value: paginator.total,
                APIItems.PAGE.value: paginator.page,
                APIItems.PER_PAGE.value: paginator.per_page,
                APIItems.NEXT.value: paginator.next_num,
                APIItems.PREV.value: paginator.prev_num,
            },
            APIItems.ITEMS.value: schema.dump(paginator.items, many=True)
        }
