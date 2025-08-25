from marshmallow import fields, post_load
from marshmallow.validate import Length

from app import ma
from app.core.validators import Unique, Exists, RulesOrNone
from app.domain.user.entities.department import Department


class DepartmentSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Department

    id = fields.Int(dump_only=True)
    name = fields.String(required=True, validate=[Length(min=1, max=255)])
    external_id = fields.String(
        allow_none=True,
        validate=[
            RulesOrNone(
                Length(min=1, max=255), Unique(entity=Department, field="external_id")
            )
        ],
    )
    external_label_id = fields.Number(
        allow_none=True,
        validate=[RulesOrNone(Unique(entity=Department, field="external_label_id"))],
    )
    threshold_freq = fields.Float(allow_none=False)
    threshold_rare = fields.Float(allow_none=False)
    threshold_recovery = fields.Float(allow_none=False)


class DepartmentUpdateSchema(DepartmentSchema):
    department_id = fields.Int(
        load_only=True, required=True, validate=[Exists(entity=Department, field="id")]
    )
    external_id = fields.String(allow_none=True, validate=[Length(min=1, max=255)])
    external_label_id = fields.Number(allow_none=True)
    threshold_freq = fields.Float(allow_none=False)
    threshold_rare = fields.Float(allow_none=False)
    threshold_recovery = fields.Float(allow_none=False)

    @post_load(pass_original=True)
    def validate_username(self, data, original_data, **_):
        for col in ["external_id", "external_label_id"]:
            if data[col]:
                rule = Unique(
                    entity=Department, field=col, except_key=data['department_id']
                )
                data[col] = rule(data[col])

        return data
