from flask import Blueprint
from app.domain.patient.entities.patient import PatientMedicalRecord
from app.domain.patient.services.patient_medical_record_service import PatientMedicalRecordService
from app.inference.predict import predict_aki
from config import Config

patient = Blueprint('patient', __name__)


@patient.cli.command('predict')
def predict():
    records = PatientMedicalRecord.find_predictions_unknown(
        Config.INFERENCE_BATCH_SIZE)
    print(f"{len(records)} will be predicted ...")

    if len(records) == 0:
        return None
    
    preds = predict_aki(records)

    PatientMedicalRecordService.update_many_predictions(records, preds)
    print("Predictions formed")
