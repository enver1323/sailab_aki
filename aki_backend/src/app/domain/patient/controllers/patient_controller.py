from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import selectinload, subqueryload
from typing import Dict, Tuple

from app.core.constants import APIItems
from app.core.generics import ListController, Controller
from app.domain.user.entities.user import User
from app.domain.patient.entities.patient import PatientMedicalRecord, Patient
from app.domain.patient.entities.evaluation import UserPatientMedicalRecordEvaluation
from app.domain.patient.queries.patient_medical_record_query import (
    PatientMedicalRecordQuery,
)
from app.domain.patient.services.patient_service import PatientService
from app.domain.patient.services.medical_record_service import MedicalRecordService
from app.domain.patient.services.patient_medical_record_service import (
    PatientMedicalRecordService,
)
from app.domain.patient.services.user_patient_medical_record_evaluation_service import (
    UserPatientMedicalRecordEvaluationService,
)
from app.domain.patient.schemas.patient_schema import (
    PatientCreateSchema,
    PatientSchema,
    PatientListSchema,
)
from app.domain.patient.schemas.patient_record_schema import (
    PatientMedicalRecordSchema,
    PatientMedicalRecordPredictionsSchema,
    PatientMedicalRecordUpdateSchema,
)
from app.domain.patient.schemas.user_patient_medical_record_evaluation_schema import (
    UserPatientMedicalRecordEvaluationSchema,
)
from app.core.view_decorators import admin_required

patient_schema = PatientSchema()
patient_list_schema = PatientListSchema()
patient_create_schema = PatientCreateSchema()
patient_record_update_schema = PatientMedicalRecordUpdateSchema()
patient_record_predictions_schema = PatientMedicalRecordPredictionsSchema()
user_patient_medical_record_evaluation_schema = (
    UserPatientMedicalRecordEvaluationSchema()
)


def get_records_keys_map(
    query: PatientMedicalRecordQuery,
) -> Dict[int, PatientMedicalRecord]:
    return {item.id: item for item in query}


class PatientList(ListController):
    @classmethod
    @jwt_required()
    def get(cls):
        data = patient_list_schema.load(request.args)

        page, per_page = cls.get_paginator_args()
        user = User.find_by_id(get_jwt_identity())
        records_query = PatientMedicalRecord.query.options(
            selectinload(PatientMedicalRecord.departments),
            selectinload(PatientMedicalRecord.patient),
            selectinload(PatientMedicalRecord.users, User.departments),
        )

        starred_query = records_query.where_starred(user.id)
        viewed_query = records_query.where_viewed(user.id)

        records_query = records_query.where_user_departments(user)

        if data["view"] == "interest":
            records_query = starred_query

        if not user.is_admin:
            records_query = (
                records_query.where_not_deleted().where_treatment_not_control()
            )

        if data["search"]:
            records_query = records_query.search(data["search"])

        if bool(data["prediction"]):
            records_query = records_query.filter(
                PatientMedicalRecord.prediction_state.in_(
                    [PatientMedicalRecord.PredictionStates.mild]
                )
            )

        if data["start_date"] is not None:
            records_query = records_query.filter(
                PatientMedicalRecord.reference_date >= data["start_date"]
            )

        if data["end_date"] is not None:
            records_query = records_query.filter(
                PatientMedicalRecord.reference_date <= data["end_date"]
            )

        records_query = records_query.order_by(
            PatientMedicalRecord.reference_date.desc()
        )

        starred_keys_map = get_records_keys_map(starred_query)
        viewed_keys_map = get_records_keys_map(viewed_query)

        records = records_query.paginate(page=page, per_page=per_page)
        patient_record_schema = PatientMedicalRecordSchema(
            user, starred_keys_map, viewed_keys_map
        )

        paginator_data = cls.prepare_paginator_response(records, patient_record_schema)

        return cls.response(200, data=paginator_data)

    @classmethod
    @admin_required()
    def post(cls):
        files = request.files

        data = patient_create_schema.load(files)
        user_id = get_jwt_identity()
        MedicalRecordService.create_from_files(user_id, data["items"])

        return cls.response(200)


class PatientEvaluation(Controller):
    @classmethod
    @admin_required()
    def get(cls):
        start_date = request.args.get("start_date", None, type=str)
        end_date = request.args.get("end_date", None, type=str)

        stats = PatientMedicalRecordService.get_aki_evaluation_statistics(
            start_date, end_date
        )

        def _form_response(total, accuracy, precision, recall):
            return {
                APIItems.TOTAL.value: total,
                APIItems.ACCURACY.value: accuracy,
                APIItems.PRECISION.value: precision,
                APIItems.RECALL.value: recall,
            }

        return cls.response(
            data={
                APIItems.GENERAL.value: _form_response(*stats),
            }
        )

    @classmethod
    @admin_required()
    def post(cls):
        files = request.files

        data = patient_create_schema.load(files)

        PatientMedicalRecordService.evaluate_from_files(data["items"])

        return cls.response(200)


class PatientMedicalRecordDetails(Controller):
    @classmethod
    @jwt_required()
    def get(cls, patient_medical_record_id: int):
        user = User.find_by_id(get_jwt_identity())
        query = PatientMedicalRecord.query.where_key(patient_medical_record_id).options(
            subqueryload(PatientMedicalRecord.patient),
            subqueryload(PatientMedicalRecord.users),
        )

        if not user.is_admin:
            query = query.where_not_deleted()

        starred_query = get_records_keys_map(query.where_starred(user.id))
        viewed_query = get_records_keys_map(query.where_viewed(user.id))

        record = query.first()
        patient_record_schema = PatientMedicalRecordSchema(
            user, starred_query, viewed_query
        )

        if record is None:
            return cls.response(404)

        PatientMedicalRecordService.view(record, user.id)

        return cls.response(data=patient_record_schema.dump(record))

    @classmethod
    @admin_required()
    def post(cls, patient_medical_record_id: int):
        record = (
            PatientMedicalRecord.query.where_deleted()
            .where_key(patient_medical_record_id)
            .first()
        )
        if record is None:
            return cls.response(404)
        PatientMedicalRecordService.recover(record)

        return cls.response()

    @classmethod
    @admin_required()
    def delete(cls, patient_medical_record_id: int):
        record = (
            PatientMedicalRecord.query.where_not_deleted()
            .where_key(patient_medical_record_id)
            .first()
        )
        if record is None:
            return cls.response(404)
        PatientMedicalRecordService.delete(record)

        return cls.response()

    @admin_required()
    def put(cls, patient_medical_record_id: int):
        record = PatientMedicalRecord.query.where_key(patient_medical_record_id).first()

        if record is None:
            return cls.response(404)

        data = patient_record_update_schema.load(request.get_json())
        record = PatientMedicalRecordService.update(record, data)

        return cls.response(data=patient_record_predictions_schema.dump(record))


class PatientMedicalRecordPredictions(Controller):
    @classmethod
    @jwt_required()
    def get(cls, patient_medical_record_id: int):
        record = PatientMedicalRecord.query.where_key(patient_medical_record_id).first()

        if record is None:
            return cls.response(404)

        user = User.find_by_id(get_jwt_identity())
        PatientMedicalRecordService.view(record, user.id)

        return cls.response(data=patient_record_predictions_schema.dump(record))


class PatientUserInterestController(Controller):
    @classmethod
    @jwt_required()
    def post(cls):
        request_json = request.get_json()

        patient = Patient.find_by_key(request_json["patient_id"])
        user = User.find_by_id(get_jwt_identity())

        if patient is None or user is None:
            return cls.response(404)

        status = PatientService.toggle_user_interest(patient, user)
        return cls.response(
            200,
            data={
                APIItems.STATUS.value: status,
                APIItems.PATIENT.value: patient_schema.dump(patient),
            },
        )


class PatientMedicalRecordEvaluations(Controller):
    @classmethod
    def _get_formatted_records(cls, user_id: int, patient_medical_record_id: int):
        records = UserPatientMedicalRecordEvaluation.find_by_ids(
            user_id, patient_medical_record_id
        )
        return user_patient_medical_record_evaluation_schema.dump(records, many=True)

    @classmethod
    @jwt_required()
    def get(cls, patient_medical_record_id: int):
        user_id = get_jwt_identity()

        return cls.response(
            200, data=cls._get_formatted_records(patient_medical_record_id, user_id)
        )

    @classmethod
    @jwt_required()
    def put(cls, patient_medical_record_id: int):
        request_json = request.get_json()

        record = PatientMedicalRecord.query.where_key(patient_medical_record_id).first()

        if record is None:
            return cls.response(404)

        user_id = get_jwt_identity()

        UserPatientMedicalRecordEvaluationService.update(
            user_id, record.id, request_json
        )

        return cls.response(
            200, data=cls._get_formatted_records(patient_medical_record_id, user_id)
        )
