from flask import send_file
from app.core.generics import Controller
from app.domain.patient.services.user_patient_medical_record_evaluation_service import (
    UserPatientMedicalRecordEvaluationService,
)
from app.core.view_decorators import admin_required


class PatientMedicalRecordEvaluationsExport(Controller):
    @classmethod
    @admin_required()
    def get(cls):
        data_path = UserPatientMedicalRecordEvaluationService.export_to_file()
        if data_path is None:
            return cls.response(404)

        return send_file(data_path, as_attachment=True)
