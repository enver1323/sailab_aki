from typing import List
import pandas as pd
from werkzeug.datastructures import FileStorage

from app.core.database import db
from app.domain.patient.entities.medical_record import MedicalRecord
from app.domain.patient.entities.patient import MedicalRecord
from app.domain.patient.services.bulk_patient_service import BulkPatientService as PatientService
# from app.domain.patient.services.patient_service import PatientService


class MedicalRecordService:
    @classmethod
    def create_from_files(cls, user_id: int, files: List[FileStorage]):
        for file in files:
            # try:
            record = MedicalRecord(user_id, file)
            record.flush()

            print("Record ready")

            PatientService.create_patients_from_medical_record(record)
            print("Committing")
            db.session.commit()
            # except:
            #     db.session.rollback()

    @classmethod
    def create(cls, data, *, session=None):
        medical_record = MedicalRecord(**data)
        medical_record.save(session)
        return medical_record
