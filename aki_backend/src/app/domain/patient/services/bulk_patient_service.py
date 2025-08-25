from typing import Dict, Optional, Sequence, List, Tuple
from datetime import datetime

from sqlalchemy.orm import lazyload
from sqlalchemy import select, insert
from app import db

from tqdm import tqdm

from app.domain.user.entities.user import User
from app.domain.user.entities.department import Department, patients_departments_table
from app.domain.user.services.department_service import DepartmentService
from app.domain.patient.entities.medical_record import MedicalRecord
from app.domain.patient.entities.patient import Patient
from app.domain.patient.services.patient_medical_record_service import (
    PatientMedicalRecordService,
)
from app.inference.preprocess import preprocess_file


class BulkPatientService:
    @classmethod
    def create_patients_from_medical_record(cls, medical_record: MedicalRecord):
        filepath = medical_record.file_storage_path

        available_departments = Department.get_inference_ids_set()
        data = preprocess_file(filepath, available_departments)

        departments = data["department"].unique()
        dep_models = DepartmentService.find_or_create_many_by_external(departments)
        print("Departments created ...")

        patient_ids, patient_dates = data["p_id"].tolist(), data["date_admin"].tolist()
        patient_models = cls.find_or_create_many_by_external(patient_ids, patient_dates)
        print("Patients created ...")

        patient_department_data = data[["p_id", "department"]].values.tolist()
        cls.add_many_departments_by_external(
            patient_department_data, patient_models, dep_models
        )
        print("Patient departments added ...")

        data = data.to_dict("records")

        print("Passed to create from records ...")
        PatientMedicalRecordService.find_or_create_many_from_records(
            data, patient_models, medical_record.id
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
    def find_or_create_many_by_external(
            cls, ids: Sequence[str], dates: Sequence[str]
    ) -> List[Patient]:
        existing_patients: List[Patient] = Patient.query.filter(
            Patient.external_id.in_(ids)
        ).all()
        existing_ids = set([patient.external_id for patient in existing_patients])

        patients_to_create = {
            idx: {"external_id": idx, "registration_date": date}
            for (idx, date) in zip(ids, dates)
            if idx not in existing_ids
        }

        if len(patients_to_create) > 0:
            cls.create_many_by_external(patients_to_create.values())

        return Patient.query.filter(Patient.external_id.in_(ids)).all()

    @classmethod
    def create_many_by_external(cls, data: Sequence[dict]):
        db.session.execute(insert(Patient), data)

    @classmethod
    def add_many_departments_by_external(
            cls,
            data: Sequence[Tuple[str, str]],
            patients: Optional[Sequence[Patient]] = None,
            departments: Optional[Sequence[Department]] = None,
    ):
        if patients is None:
            patients: List[Patient] = Patient.query.filter(
                Patient.external_id.in_(set([pat for (pat, _) in data]))
            ).all()

        if departments is None:
            departments: List[Department] = Department.query.filter(
                Department.external_id.in_(set([dep for (_, dep) in data]))
            ).all()

        patients_ext_map = {pat.external_id: pat for pat in patients}
        departments_ext_map = {dep.external_id: dep for dep in departments}

        patients_in_map = {pat.id: pat for pat in patients}
        departments_in_map = {dep.id: dep for dep in departments}

        patient_deps = list(db.session.execute(
            select(patients_departments_table).where(
                patients_departments_table.c.patient_id.in_(patients_in_map.keys())
            )
        ))

        pat_dep_ext_map = {tuple(datum): True for datum in data}
        for patient_dep in patient_deps:
            if patient_dep.patient_id not in patients_in_map or patient_dep.department_id not in departments_in_map:
                continue

            key = (
                patients_in_map[patient_dep.patient_id].external_id,
                departments_in_map[patient_dep.department_id].external_id,
            )
            if key in pat_dep_ext_map:
                pat_dep_ext_map[key] = False

        pat_deps_to_create = [
            {
                "patient_id": patients_ext_map[pat].id,
                "department_id": departments_ext_map[dep].id,
            }
            for (pat, dep), flag in pat_dep_ext_map.items()
            if flag
        ]
        if len(pat_deps_to_create) > 0:
            cls.create_many_patients_departments(pat_deps_to_create)

    @classmethod
    def create_many_patients_departments(cls, data: Sequence[dict]):
        db.session.execute(insert(patients_departments_table), data)
