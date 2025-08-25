from typing import Optional
import json

from app.core.generics import Entity
from app.domain.user.entities.action_history import ActionHistory, ActionTypes


class ActionHistoryService:
    @classmethod
    def create(cls, data: dict) -> ActionHistory:
        history = ActionHistory(**data)
        history.save()

        return history

    @classmethod
    def create_from_entity(cls, entity: Entity, user_id: int, action_type: ActionTypes):
        return cls.create({
            "entity": entity.__class__,
            "entity_key": ActionHistory.encode_entity_key(entity),
            "user_id": user_id,
            "action_type": action_type
        })

    @classmethod
    def exists_by_entity(cls, entity: Entity, user_id: int, action_type: ActionTypes) -> bool:
        return ActionHistory.query.where_entity(entity).filter(
            ActionHistory.user_id == user_id,
            ActionHistory.action_type == action_type
        ).scalar()

    @classmethod
    def create_from_entity_if_not_exists(cls, entity: Entity, user_id: int, action_type: ActionTypes) -> Optional[ActionHistory]:
        history_exists = cls.exists_by_entity(
            entity=entity,
            user_id=user_id,
            action_type=action_type
        )
        
        if history_exists:
            return

        return cls.create_from_entity(
            entity=entity,
            user_id=user_id,
            action_type=action_type
        )
