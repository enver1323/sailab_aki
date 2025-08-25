from app.core.generics import Entity, Query


class DepartmentQuery(Query):
    def where_external_not_none(self):
        model = self.models[0]
        return self.filter(
            model.external_id.isnot(None), model.external_label_id.isnot(None)
        )
