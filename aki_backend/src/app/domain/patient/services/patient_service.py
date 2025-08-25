from typing import Dict, Optional
from datetime import datetime
from sqlalchemy.orm import lazyload

from tqdm import tqdm

from app.domain.user.entities.user import User
from app.domain.user.entities.department import Department
from app.domain.user.services.department_service import DepartmentService
from app.domain.patient.entities.medical_record import MedicalRecord
from app.domain.patient.entities.patient import Patient
from app.domain.patient.services.patient_medical_record_service import (
    PatientMedicalRecordService,
)
from app.inference.preprocess import preprocess_file


class PatientService:
    @classmethod
    def create_patients_from_medical_record(cls, medical_record: MedicalRecord):
        filepath = medical_record.file_storage_path

        available_departments = Department.get_inference_ids_set()
        data = preprocess_file(filepath, available_departments)

        departments = data["department"].unique()
        patients = data["p_id"].unique().astype("str")

        departments = Department.query.filter(
            Department.external_id.in_(departments)
        ).all()
        patients = Patient.query.filter(Patient.external_id.in_(patients)).all()

        departments = {dpt.external_id: dpt for dpt in departments}
        patients = {patient.external_id: patient for patient in patients}

        data = data.to_dict("records")

        for datum in tqdm(data):
            cls.create_record_from_file_data(
                datum,
                medical_record.id,
                departments,
                departments,
            )

    @classmethod
    def create_record_from_file_data(
        cls,
        src_data: dict,
        medical_record_id: int,
        patients: Dict[str, Patient] = {},
        departments: Dict[str, Department] = {},
    ) -> Patient:
        external_id = src_data["p_id"]
        registration_date = datetime.strptime(src_data["date_admin"], "%Y-%m-%d")

        patient = patients.get(
            external_id,
            cls.find_or_new_by_external(external_id, registration_date),
        )
        patient.add()

        department = None
        if src_data["department"] is not None:
            dpt_ext_id = src_data["department"]
            department = departments.get(
                dpt_ext_id, DepartmentService.find_or_new_by_external(dpt_ext_id)
            )

            if not patient.has_related("departments", department):
                patient.departments.append(department)

        patient.flush()

        patient_record = PatientMedicalRecordService.find_or_new(
            patient.id,
            registration_date,
            medical_record_id,
            src_data,
        )

        return patient, patient_record

    @classmethod
    def find_or_new_by_external(
        cls, external_id: str, registration_date: datetime
    ) -> Patient:
        patient = Patient.find_by_external_id(external_id)
        if patient is None:
            patient = cls.new_from_external(external_id, registration_date)
        return patient

    @classmethod
    def new_from_external(
        cls, external_id: str, registration_date: datetime
    ) -> Patient:
        return Patient(external_id, registration_date)

    @classmethod
    def toggle_user_interest(cls, patient: Patient, user: User) -> bool:
        patient = (
            Patient.query.filter(Patient.id == patient.id)
            .options(lazyload(Patient.users))
            .first()
        )

        status = user.id in [pat_user.id for pat_user in patient.users]

        if user.id in {pat_user.id for pat_user in patient.users}:
            patient.users.remove(user)
        else:
            patient.users.append(user)

        patient.save()

        return not status
