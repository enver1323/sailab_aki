from typing import Optional, Sequence

from app.core.generics import Column, Entity, db
from app.domain.user.entities.user import User
from app.domain.patient.entities.patient import PatientMedicalRecord
from app.domain.patient.queries.user_patient_medical_record_evaluation_query import (
    UserPatientMedicalRecordEvaluationQuery,
)


class UserPatientMedicalRecordEvaluation(Entity):
    __tablename__ = "user_patient_medical_record_evaluations"
    query_class = UserPatientMedicalRecordEvaluationQuery

    def __init__(
        self, user_id: int, patient_medical_record_id: int, column_name: str, value: int
    ):
        self.user_id = user_id
        self.patient_medical_record_id = patient_medical_record_id
        self.column_name = column_name
        self.value = value

    # Attributes
    user_id = Column(
        db.Integer, db.ForeignKey(User.id, ondelete="CASCADE"), primary_key=True
    )
    patient_medical_record_id = Column(
        db.Integer,
        db.ForeignKey(PatientMedicalRecord.id, ondelete="CASCADE"),
        primary_key=True,
    )
    column_name = Column(db.String(255), primary_key=True)
    value = Column(db.Integer)

    # Relations
    user = db.relationship("User", lazy="noload", back_populates="evaluations")
    patient_medical_record = db.relationship(
        "PatientMedicalRecord", lazy="noload", back_populates="evaluations"
    )

    @classmethod
    def find_by_ids(
        cls, user_id: int, patient_medical_record_id: int
    ) -> Optional[Sequence["UserPatientMedicalRecordEvaluation"]]:
        return (
            cls.query.where_user_id(user_id)
            .where_patient_medical_record_id(patient_medical_record_id)
            .all()
        )

    def __repr__(self):
        return f"Evaluation({self.user_id}, {self.patient_medical_record_id}, {self.column_name}, {self.value})"
