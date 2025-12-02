from marshmallow import fields, post_load, pre_load

from app import ma


class UserPatientMedicalRecordEvaluationSchema(ma.SQLAlchemySchema):
    column_name = fields.String()
    value = fields.Integer()
