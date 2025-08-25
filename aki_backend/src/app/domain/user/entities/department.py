from enum import Enum
from typing import Optional, Dict, Set

from app.core.generics import Entity, Column
from app.core.database import db
from app.domain.user.queries.department_query import DepartmentQuery


users_departments_table = db.Table(
    "users_departments",
    db.metadata,
    Column("user_id", db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "department_id",
        db.ForeignKey("departments.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
patients_departments_table = db.Table(
    "patients_departments",
    db.metadata,
    Column(
        "patient_id", db.ForeignKey("patients.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "department_id",
        db.ForeignKey("departments.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class TemporalType(Enum):
    freq = "freq"
    rare = "rare"
    recovery = "recovery"


class Department(Entity):
    __tablename__ = "departments"
    query_class = DepartmentQuery

    def __init__(
        self,
        name: str,
        external_id: Optional[str] = None,
        external_label_id: Optional[str] = None,
        threshold_freq: Optional[float] = None,
        threshold_rare: Optional[float] = None,
        threshold_recovery: Optional[float] = None,
    ):
        self.name = name
        self.external_id = external_id
        self.external_label_id = external_label_id
        self.threshold_freq = threshold_freq
        self.threshold_rare = threshold_rare
        self.threshold_recovery = threshold_recovery

    id = Column(db.Integer, primary_key=True)
    name = Column(db.String(255))
    external_id = Column(db.String(50), unique=True, nullable=True)
    external_label_id = Column(db.Integer(), unique=True, nullable=True)
    threshold_freq = Column(
        db.Float(precision=8, asdecimal=False, decimal_return_scale=None), default=0.5
    )
    threshold_rare = Column(
        db.Float(precision=8, asdecimal=False, decimal_return_scale=None), default=0.5
    )
    threshold_recovery = Column(
        db.Float(precision=8, asdecimal=False, decimal_return_scale=None), default=0.5
    )

    users = db.relationship(
        "User",
        secondary="users_departments",
        uselist=True,
        lazy="noload",
        back_populates="departments",
    )
    patients = db.relationship(
        "Patient",
        secondary="patients_departments",
        uselist=True,
        lazy="noload",
        back_populates="departments",
    )
    patient_medical_records = db.relationship(
        "PatientMedicalRecord",
        secondary="patients_departments",
        uselist=True,
        lazy="noload",
        back_populates="departments",
        primaryjoin="Department.id==patients_departments.c.department_id",
        secondaryjoin="PatientMedicalRecord.patient_id==patients_departments.c.patient_id",
        viewonly=True,
    )

    @classmethod
    def find_by_external_id(cls, _id: str) -> Optional["Department"]:
        return cls.query.filter(
            cls.external_id.isnot(None), cls.external_id == _id
        ).first()

    @classmethod
    def find_by_id(cls, _id: int) -> Optional["Department"]:
        return cls.query.filter(cls.id == _id).first()

    @classmethod
    def get_inference_ids_set(cls) -> Set[str]:
        departments = cls.query.where_external_not_none().all()
        return set([department.external_id for department in departments])

    @classmethod
    def get_inference_thresholds(cls) -> Dict[str, Dict[str, float]]:
        departments = cls.query.where_external_not_none().all()
        thresholds = {t_type.value: dict() for t_type in TemporalType}
        for department in departments:
            thresholds[TemporalType.freq.value][department.external_label_id] = department.threshold_freq
            thresholds[TemporalType.rare.value][department.external_label_id] = department.threshold_rare
            thresholds[TemporalType.recovery.value][department.external_label_id] = department.threshold_recovery
        return thresholds
