import typing

from marshmallow import ValidationError
from marshmallow.validate import Validator, Length
from werkzeug.datastructures import FileStorage

from app.core.generics import Entity
from app.core.localization import gettext
from sqlalchemy.inspection import inspect


class Exists(Validator):
    def __init__(self, *, entity: typing.Type[Entity], field: str):
        self.entity = entity
        self.field = field

    def __call__(self, value: typing.Any) -> typing.Any:
        attr = getattr(self.entity, self.field)
        value_exists = self.entity.query.filter(
            attr.isnot(None)
        ).filter(
            attr == value
        ).count()
        if not bool(value_exists):
            raise ValidationError(gettext("errors.no_records"))
        return value


class Unique(Validator):
    def __init__(self, *, entity: typing.Type[Entity], field: str, except_key: typing.Optional[int] = None):
        self.entity = entity
        self.field = field
        self.except_key = except_key

    def __call__(self, value: typing.Any) -> typing.Any:
        attr = getattr(self.entity, self.field)
        value_exists_query = self.entity.query.filter(
            attr.isnot(None)
        ).filter(
            attr == value
        )
        if self.except_key is not None:
            primary_key = inspect(self.entity).primary_key[0]
            value_exists_query = value_exists_query.filter(
                primary_key != self.except_key
            )

        value_exists = value_exists_query.count()

        if bool(value_exists):
            raise ValidationError(
                gettext("errors.unique_value", field=self.field)
            )

        return value


class GreaterThan(Validator):
    def __init__(self, comparator: typing.Union[int, float]):
        self.comparator = comparator

    def __call__(self, value: typing.Union[int, float]) -> typing.Union[int, float]:
        if value <= self.comparator:
            raise ValidationError(
                gettext("errors.less_than", value=value, comparator=self.comparator))
        return value


class File(Validator):
    def __init__(self, *, content_types:typing.List[str]):
        self.content_types = content_types

    def __call__(self, value):
        if value is None:
            return value
        
        if type(value) != FileStorage:
            raise ValidationError(gettext("errors.file"))
        
        if value.content_type not in self.content_types:
            raise ValidationError(gettext("errors.content_types", content_types=self.content_types))
        
        return value


class RulesOrNone(Validator):
    def __init__(self, *rules: Validator):
        self.rules = rules
    
    def __call__(self, value):
        if value is None:
            return value
        
        for rule in self.rules:
            value = rule(value)
            
        return value