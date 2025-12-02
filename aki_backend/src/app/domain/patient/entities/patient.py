from enum import Enum
import datetime as dt
from functools import cache
from collections import defaultdict
from typing import Optional, List, Dict

from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from app.inference.utils.columns import target as target_cols
from app.core.generics import Column, Entity, db
from app.domain.patient.entities.medical_record import MedicalRecord
from app.domain.patient.queries.patient_medical_record_query import (
    PatientMedicalRecordQuery,
)
from app.domain._shared.services.media_service import JSONMediaService

users_patients_table = db.Table(
    "users_patients",
    db.metadata,
    Column("user_id", db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "patient_id", db.ForeignKey("patients.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Patient(Entity):
    __tablename__ = "patients"

    def __init__(
        self,
        external_id: str,
        registration_date: dt.datetime,
        name: Optional[str] = None,
    ):
        self.external_id = external_id
        self.registration_date = registration_date
        if name is not None:
            self.name = name

    # Attributes
    id = Column(db.Integer, primary_key=True)
    name = Column(db.String(255), nullable=True)
    external_id = Column(db.String(255), unique=True)
    registration_date = Column(db.DateTime)

    patient_medical_records = db.relationship(
        "PatientMedicalRecord", back_populates="patient", lazy="subquery"
    )
    departments = db.relationship(
        "Department",
        secondary="patients_departments",
        back_populates="patients",
        lazy="dynamic",
    )
    users = db.relationship(
        "User", secondary="users_patients", back_populates="patients", lazy="dynamic"
    )

    @classmethod
    def find_by_key(cls, _id: int) -> Optional["Patient"]:
        return cls.query.filter(cls.id == _id).first()

    @classmethod
    def find_by_external_id(cls, _id: str) -> Optional["Patient"]:
        _id = str(_id)
        return cls.query.filter(
            cls.external_id.isnot(None), cls.external_id == _id
        ).first()


class PatientMedicalRecord(Entity):
    __tablename__ = "patient_medical_records"
    __table_args__ = (db.UniqueConstraint("id", "reference_date"),)

    query_class = PatientMedicalRecordQuery

    ALERT_THRESHOLD = 0.5
    ALERT_CRITICAL_THRESHOLD = 0.5

    class PredictionStates(Enum):
        unknown = "unknown"
        filtered = "filtered"
        safe = "safe"
        mild = "mild"

    class Treatment(Enum):
        control = "control"
        experimental = "experimental"

    def __init__(
        self,
        patient_id: int,
        medical_record_id: int,
        data,
        reference_date: dt.datetime,
        prediction_state: PredictionStates = PredictionStates.unknown,
    ):
        self.patient_id = patient_id
        self.medical_record_id = medical_record_id
        self.data = data
        self.reference_date = reference_date
        self.prediction_state = prediction_state

    id = Column(db.Integer, primary_key=True)
    patient_id = Column(db.Integer, db.ForeignKey(Patient.id, ondelete="RESTRICT"))
    medical_record_id = Column(
        db.Integer, db.ForeignKey(MedicalRecord.id, ondelete="RESTRICT")
    )
    data = Column(JSONB())
    # _data_path = Column(db.String(255), nullable=True)
    reference_date = Column(db.DateTime)
    prediction_state = Column(db.Enum(PredictionStates))
    prediction = Column(JSONB(), nullable=True)
    # _prediction_path = Column(db.String(255), nullable=True)
    actual_state = Column(db.Enum(PredictionStates), nullable=True)
    treatment = Column(db.Enum(Treatment), nullable=True)
    deleted_at = Column(db.DateTime, nullable=True)
    updated_at = Column(db.DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(db.DateTime, default=func.now())

    # Relations
    users = db.relationship(
        "User",
        secondary="users_patients",
        back_populates="patient_medical_records",
        lazy="noload",
        primaryjoin="PatientMedicalRecord.patient_id==users_patients.c.patient_id",
        secondaryjoin="User.id==users_patients.c.user_id",
        viewonly=True,
    )
    departments = db.relationship(
        "Department",
        secondary="patients_departments",
        back_populates="patient_medical_records",
        lazy="noload",
        primaryjoin="PatientMedicalRecord.patient_id==patients_departments.c.patient_id",
        secondaryjoin="Department.id==patients_departments.c.department_id",
        viewonly=True,
    )
    patient = db.relationship(
        "Patient", back_populates="patient_medical_records", lazy="noload"
    )
    medical_record = db.relationship(
        "MedicalRecord", back_populates="patient_medical_records", lazy="noload"
    )
    evaluations = db.relationship(
        "UserPatientMedicalRecordEvaluation", uselist=True, lazy="noload", back_populates="patient_medical_record"
    )

    # @property
    # def data(self):
    #     if self._data_path is None:
    #         return None
    #     return JSONMediaService.get_media(self._data_path)

    # @data.setter
    # def data(self, value):
    #     if self._data_path is not None:
    #         JSONMediaService.remove_media(self._data_path)
    #     JSONMediaService.set_media("patient_medical_records/data", value)

    # @property
    # def prediction(self):
    #     if self._prediction_path is None:
    #         return None
    #     return JSONMediaService.get_media(self._prediction_path)

    # @prediction.setter
    # def prediction(self, value):
    #     if self._prediction_path is not None:
    #         JSONMediaService.remove_media(self._data_path)
    #     JSONMediaService.set_media("patient_medical_records/prediction", value)

    @property
    def previous_actual_state(self) -> bool:
        if self.data is None:
            return False
        return any([self.data.get(col, False) for col in target_cols])

    @classmethod
    def find_by_patient_id_and_date(cls, _patient_id: int, date: dt.datetime):
        return cls.query.filter(
            cls.patient_id == _patient_id, cls.reference_date == date
        ).first()

    @classmethod
    def find_predictions_unknown(cls, limit=128):
        return (
            cls.query.filter(cls.prediction_state == cls.PredictionStates.unknown)
            .limit(limit)
            .all()
        )

    @classmethod
    def find_by_external_id_and_date(cls, external_id: int, date: dt.datetime):
        return cls.query.filter(
            cls.patient.has(external_id=external_id), cls.reference_date == date
        ).first()

    def is_starred(self, user_id: int) -> bool:
        if self.users is None or len(self.users) == 0:
            return False

        for user in self.users:
            if user.id == user_id:
                return True

        return False

    @cache
    def get_top_explanations_by_day(self, limit: int) -> Dict[str, Dict[str, float]]:
        if self.prediction is None or len(self.prediction.get("explanations", {})) == 0:
            return None

        top_explanations = {}
        for day, items in self.prediction["explanations"].items():
            keys = sorted(items.keys(), key=items.__getitem__, reverse=True)[:limit]
            top_explanations[day] = {key: items[key] for key in keys}

        return top_explanations

    @cache
    def get_top_explanations_in_any(self, limit: int) -> Dict[str, List[str]]:
        top_exps_by_day = self.get_top_explanations_by_day(limit)
        if top_exps_by_day is None:
            return None

        top_explanations = defaultdict(list)
        for day, items in top_exps_by_day.items():
            for item in items:
                top_explanations[item].append(day)

        return top_explanations

    @property
    def max_predicted_day(self) -> int:
        if self.prediction is None:
            return -1

        predicted_logits = self.prediction.get("logits", {})
        if len(predicted_logits) == 0:
            return -1

        predicted_days = [int(day) for day in predicted_logits.keys()]

        return max(predicted_days)
