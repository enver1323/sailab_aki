import json
from collections import namedtuple
from datetime import datetime
from copy import deepcopy
import warnings
from typing import List, Tuple, Optional, Dict, Sequence, Any

from sqlalchemy import text
from sqlalchemy.orm import subqueryload

from werkzeug.datastructures import FileStorage

from sqlalchemy import insert, update

from app.core.database import db
from app.domain.patient.entities.patient import PatientMedicalRecord, Patient
from app.domain.user.entities.department import Department
from app.domain.user.entities.action_history import ActionTypes
from app.domain.user.services.action_history_service import ActionHistoryService
from app.inference.preprocess import preprocess_file
from app.inference.utils.columns import target as target_cols

EvaluationStats = namedtuple(
    "EvaluationStats", ("total", "accuracy", "precision", "recall")
)


class PatientMedicalRecordService:
    INSERT_BATCH_SIZE = 1000

    @classmethod
    def find_or_new(
            cls,
            patient_id: int,
            registration_date: datetime,
            medical_record_id: int,
            data: dict,
    ) -> PatientMedicalRecord:
        patient_record = PatientMedicalRecord.find_by_patient_id_and_date(
            patient_id, registration_date
        )
        if patient_record is None:
            patient_record = PatientMedicalRecord(
                patient_id, medical_record_id, data, registration_date
            )
            patient_record.flush()

        patient_record.fill(
            {
                "medical_record_id": medical_record_id,
                "data": data,
                "registration_date": registration_date,
                "prediction_state": PatientMedicalRecord.PredictionStates.unknown,
                "prediction": None,
                "actual_result": None,
            }
        )
        patient_record.flush()
        return patient_record

    @classmethod
    def _update_prediction(cls, old_pred: Dict[str, Any], new_pred: Dict[str, Any]) -> Dict[str, Any]:
        return {
            key: {**new_pred.get(key, {}), **old_pred.get(key, {})}  # Only add unseen values
            for key in new_pred.keys()
        }

    @classmethod
    def update_many_predictions(
            cls, records: List[PatientMedicalRecord], predictions: List[Dict[str, Any]]
    ):
        def get_last_day_entry(entry, key):
            return entry[key][max(entry[key].keys())]

        try:
            for record, datum in zip(records, predictions):
                prediction = datum
                prediction_state = PatientMedicalRecord.PredictionStates.filtered

                if len(datum.get("prediction")) > 0:
                    last_pred = get_last_day_entry(datum, "prediction")
                    prediction_state = (
                        PatientMedicalRecord.PredictionStates.mild
                        if last_pred
                        else PatientMedicalRecord.PredictionStates.safe
                    )
                    prediction = cls._update_prediction(record.prediction or {}, prediction)

                if prediction_state == PatientMedicalRecord.PredictionStates.filtered and record.prediction_state != PatientMedicalRecord.PredictionStates.unknown:
                    continue

                record.fill(
                    {
                        "prediction_state": prediction_state,
                        "prediction": prediction,
                    }
                )
                record.flush()
            db.session.commit()
        except Exception as e:
            db.session.rollback()

    @classmethod
    def view(cls, patient_record: PatientMedicalRecord, user_id: int):
        return ActionHistoryService.create_from_entity_if_not_exists(
            patient_record, user_id, ActionTypes.view
        )

    @classmethod
    def evaluate_from_files(cls, files: List[FileStorage]):
        try:
            for file in files:
                data = preprocess_file(file.filename)

                pos_patients = (data[target_cols] == 1).any(axis=1)

                data["actual_state"] = PatientMedicalRecord.PredictionStates.safe.value
                data.loc[pos_patients, "actual_state"] = (
                    PatientMedicalRecord.PredictionStates.mild.value
                )

                for datum in data.to_dict("records"):
                    record = PatientMedicalRecord.find_external_id_and_date(
                        str(datum["p_id"]),
                        datetime.strptime(datum["date_admin"], "%Y-%m-%d"),
                    )
                    if record is not None:
                        record.actual_state = datum["actual_state"]
                        record.flush()

            db.session.commit()
        except:
            db.session.rollback()

    @classmethod
    def _get_evaluation_per_states(
            cls,
            states: Dict[str, Sequence[str]],
            start_date: Optional[datetime] = None,
            end_date: Optional[datetime] = None,
    ) -> EvaluationStats:
        stat, states = PatientMedicalRecord.query.evaluate(states, start_date, end_date)

        total_precision = 0
        total_recall = 0
        total_accuracy = 0

        for state in states:
            total, tp, fp, fn, tn = (
                stat[f"{state}_total"],
                stat[f"{state}_tp"],
                stat[f"{state}_fp"],
                stat[f"{state}_fn"],
                stat[f"{state}_tn"],
            )
            total_precision += 0 if tp + fn == 0 else tp / (tp + fn)
            total_recall += 0 if tp + fp == 0 else tp / (tp + fp)
            total_accuracy += 0 if total == 0 else (tp + tn) / total

        n_states = len(states)

        return EvaluationStats(
            total,
            total_accuracy / n_states,
            total_precision / n_states,
            total_recall / n_states,
        )

    @classmethod
    def get_aki_evaluation_statistics(
            cls, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None
    ) -> EvaluationStats:
        pred_states = PatientMedicalRecord.PredictionStates
        states_aki = {
            "aki": (
                (pred_states.mild.value,),
                (pred_states.safe.value,),
            )
        }
        return cls._get_evaluation_per_states(states_aki, start_date, end_date)

    @classmethod
    def delete(cls, patient_medical_record: PatientMedicalRecord):
        patient_medical_record.deleted_at = datetime.now()
        patient_medical_record.save()

    @classmethod
    def recover(cls, patient_medical_record: PatientMedicalRecord):
        patient_medical_record.deleted_at = None
        patient_medical_record.save()

    @classmethod
    def update(
            cls, patient_medical_record: PatientMedicalRecord, data: dict
    ) -> PatientMedicalRecord:
        patient_medical_record.fill(data)
        patient_medical_record.save()
        return patient_medical_record

    @classmethod
    def find_or_create_many_from_records(
            cls,
            data: Sequence[dict],
            patients: Sequence[Patient],
            medical_record_id: int,
    ):
        patients_ext_map = {patient.external_id: patient for patient in patients}
        patients_in_map = {patient.id: patient for patient in patients}

        pat_med_records: List[PatientMedicalRecord] = PatientMedicalRecord.query.filter(
            PatientMedicalRecord.patient_id.in_(set(patients_in_map.keys()))
        ).all()

        data_map = {(item["p_id"], item["date_admin"]): item for item in data}

        print("Updating old records with new data ...")
        records_to_update = {}
        for record in pat_med_records:
            patient = patients_in_map[record.patient_id]
            key = patient.external_id, record.reference_date.strftime("%Y-%m-%d")
            if key in data_map:
                records_to_update[key] = record.id
                datum = data_map[key]

                if json.dumps(record.data) == json.dumps(datum):
                    continue
                record.fill(
                    {
                        "data": datum,
                        "registration_date": datum["date_admin"],
                    }
                )
                record.flush()

        print("Performing general update ...")
        db.session.execute(
            update(PatientMedicalRecord)
            .where(PatientMedicalRecord.id.in_(records_to_update.values()))
            .values(
                prediction_state=PatientMedicalRecord.PredictionStates.unknown,
                medical_record_id=medical_record_id,
                actual_state=None,
            )
        )

        print("Formatting new records ...")
        data_to_create = [
            data_map[key] for key in data_map.keys() if key not in records_to_update
        ]
        records_to_create = [
            {
                "data": item,
                "medical_record_id": medical_record_id,
                "patient_id": patients_ext_map[item["p_id"]].id,
                "reference_date": item["date_admin"],
                "prediction_state": PatientMedicalRecord.PredictionStates.unknown,
            }
            for item in data_to_create
        ]
        if len(records_to_create) == 0:
            return

        print("Creating new records ...")
        db.session.execute(
            insert(PatientMedicalRecord).return_defaults(),
            [record for record in records_to_create],
        )

        # last_id = next(db.session.execute(text("SELECT LAST_INSERT_ID();")))[0]
        # record_ids = list(range(last_id - len(records_to_create) + 1, last_id + 1))

        # cls.save_records_data(record_ids, data)

    @classmethod
    def save_records_data(cls, record_ids: List[int], data: List[dict]):
        records = PatientMedicalRecord.query.filter(
            PatientMedicalRecord.id.in_(record_ids)
        ).all()
        for record, datum in zip(records, data):
            record.fill(
                {
                    "data": datum,
                    "prediction_state": PatientMedicalRecord.PredictionStates.unknown,
                }
            )
            record.flush()
        db.session.commit()
