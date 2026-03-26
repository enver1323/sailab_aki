from app.core.generics import Query


class UserPatientMedicalRecordEvaluationQuery(Query):
    def where_user_id(self, user_id: int):
        model = self.models[0]
        return self.filter(model.user_id == user_id)

    def where_patient_medical_record_id(self, patient_medical_record_id: int):
        model = self.models[0]
        return self.filter(model.patient_medical_record_id == patient_medical_record_id)
