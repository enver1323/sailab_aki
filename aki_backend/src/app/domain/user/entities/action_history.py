from datetime import datetime
from enum import Enum
from typing import Optional
import json

from app.core.generics import Entity, db, Column
from app.domain.user.entities.user import User
from app.domain.user.queries.action_history_query import ActionHistoryQuery


class ActionTypes(Enum):
    view = 'view'


class ActionHistory(Entity):
    __tablename__ = 'action_history'
    query_class = ActionHistoryQuery

    def __init__(
        self,
        user_id: int,
        entity: Entity,
        entity_key,
        action_type: ActionTypes,
        created_at: Optional[datetime] = None
    ):
        self.user_id = user_id
        self.entity = entity.__table__.name
        self.entity_key = entity_key
        self.action_type = action_type
        self.created_at = created_at

    # Attributes
    user_id = Column(db.Integer, db.ForeignKey(
        User.id, ondelete="CASCADE"), primary_key=True)
    entity = Column(db.String(255), primary_key=True)
    entity_key = Column(db.String(255), primary_key=True)
    action_type = Column(db.Enum(ActionTypes), primary_key=True)
    created_at = Column(db.DateTime, default=datetime.utcnow, primary_key=True)

    user = db.relationship('User', back_populates='actions', lazy='noload')

    @classmethod
    def encode_entity_key(cls, entity: Entity):
        return json.dumps({col.name: getattr(entity, col.name) for col in entity.get_primary_key()})

    def decode_entity_key(self):
        return json.loads(self.entity_key)

    @classmethod
    def encode_entity(cls, entity: Entity):
        return entity.__table__.name
