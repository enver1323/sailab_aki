from app.core.generics import Entity, Query


class ActionHistoryQuery(Query):
    def where_entity(self, entity: Entity) -> "ActionHistoryQuery":
        model = self.models[0]

        return self.filter(
            model.entity == model.encode_entity(entity),
            model.entity_key == model.encode_entity_key(entity),
        )
