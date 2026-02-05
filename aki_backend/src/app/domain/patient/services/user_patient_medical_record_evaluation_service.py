import os
from typing import Optional, Dict, Tuple, List

import datetime
from config import Config

from app.core.database import db
from app.domain.patient.entities.evaluation import UserPatientMedicalRecordEvaluation
from app.domain.patient.entities.patient import PatientMedicalRecord


class UserPatientMedicalRecordEvaluationService:
    @classmethod
    def update(
        cls,
        user_id: int,
        patient_medical_record_id: int,
        data: Dict[str, int],
    ):
        try:
            (
                UserPatientMedicalRecordEvaluation.query.where_user_id(user_id)
                .where_patient_medical_record_id(patient_medical_record_id)
                .delete()
            )

            for column_name, value in data.items():
                user_eval = UserPatientMedicalRecordEvaluation(
                    user_id, patient_medical_record_id, column_name, value
                )
                user_eval.add()

            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            raise e

    @classmethod
    def report(cls) -> List[dict]:
        eval_records = UserPatientMedicalRecordEvaluation.query.all()
        if len(eval_records) == 0:
            return {}
        patient_medical_record_ids = set(
            [eval_record.patient_medical_record_id for eval_record in eval_records]
        )
        patient_medical_records = PatientMedicalRecord.query.where(
            PatientMedicalRecord.id.in_(patient_medical_record_ids)
        ).all()
        patient_id_map = {
            pat_med_record.id: pat_med_record.data["p_id"]
            for pat_med_record in patient_medical_records
        }
        collection = [
            {
                **eval_record.to_dict(),
                "patient_medical_record_id": patient_id_map[
                    eval_record.patient_medical_record_id
                ],
            }
            for eval_record in eval_records
        ]
        return collection

    @classmethod
    def export_to_file(cls, separator: str = ",") -> Optional[str]:
        data = cls.report()
        if len(data) == 0:
            return None

        now = datetime.datetime.now()
        filename = str(now.date()) + "_" + str(now.time()).replace(":", ".") + ".csv"
        filepath = os.path.join(Config.EVALUATIONS_UPLOAD_PATH, filename)
        abs_filepath = os.path.join(Config.APP_DIR, filepath)
        os.makedirs(os.path.dirname(abs_filepath), exist_ok=True)

        with open(abs_filepath, "w") as file:
            file.write(separator.join(data[0].keys()) + "\n")
            for datum in data:
                file.write(separator.join(map(str, datum.values())) + "\n")

        return filepath
