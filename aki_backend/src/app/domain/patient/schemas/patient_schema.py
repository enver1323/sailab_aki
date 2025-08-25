from marshmallow import fields, post_load, pre_load

from app import ma
from app.domain.patient.entities.patient import Patient, PatientMedicalRecord
from app.core.validators import File


class PatientCreateSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Raw(type="file"), required=True)

    @pre_load
    def validate_items(self, data, **kwargs):
        items = data.getlist('items')
        return {"items": items}
    
class PatientSchema(ma.SQLAlchemySchema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    external_id = fields.String()
    regsitration_date = fields.DateTime()

class PatientListSchema(ma.SQLAlchemySchema):
    view = fields.String()
    search = fields.String()
    prediction = fields.Integer(load_default=0)
    start_date = fields.String(load_default=None)
    end_date = fields.String(load_default=None)
    page = fields.Integer(load_default=1)
    per_page = fields.Integer()