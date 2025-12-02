from typing import Sequence, Dict

from sqlalchemy import insert
from app.core.database import db
from app.domain.patient.entities.evaluation import UserPatientMedicalRecordEvaluation


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
