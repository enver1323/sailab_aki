from flask import Blueprint
from app.domain.patient.services.user_patient_medical_record_evaluation_service import (
    UserPatientMedicalRecordEvaluationService,
)


eval = Blueprint("eval", __name__)


@eval.cli.command("export")
def export():
    filepath = UserPatientMedicalRecordEvaluationService.export_to_file()
    if filepath is None:
        print(f"No records to export")

    print(f"Exported file is located at: {filepath}")
