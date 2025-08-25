from enum import Enum
from typing import Optional, List
from werkzeug.security import generate_password_hash, check_password_hash
from app.core.generics import Column, Entity, db


class UserRoles(Enum):
    admin = 'admin'
    user = 'user'


class User(Entity):
    __tablename__ = 'users'

    __DEFAULT_PASSWORD = "cderfv34"

    def __init__(
        self,
        username: str,
        name: str,
        password: Optional[str] = __DEFAULT_PASSWORD,
        external_id: Optional[str] = None,
        role: Optional[UserRoles] = UserRoles.user
    ):
        self.username = username
        self.name = name
        self.external_id = external_id
        self.password = password
        self.role = role

    # Attributes
    id = Column(db.Integer, primary_key=True)
    username = Column(db.String(255), unique=True)
    name = Column(db.String(255))
    role = Column(db.Enum(UserRoles))
    external_id = Column(db.String(255), unique=True, nullable=True)
    _password_hash = Column('password_hash', db.String(255))

    # Relations
    medical_records = db.relationship(
        "MedicalRecord", uselist=True, lazy='noload', back_populates='user'
    )
    departments = db.relationship(
        "Department", secondary="users_departments", uselist=True, lazy='dynamic', back_populates='users'
    )
    patients = db.relationship(
        "Patient", secondary="users_patients", uselist=True, lazy='noload', back_populates='users'
    )
    patient_medical_records = db.relationship(
        "PatientMedicalRecord", secondary="users_patients", uselist=True, lazy='noload', back_populates='users',
        primaryjoin="User.id==users_patients.c.user_id",
        secondaryjoin="PatientMedicalRecord.patient_id==users_patients.c.patient_id",
        viewonly=True
    )
    actions = db.relationship(
        "ActionHistory", uselist=True, lazy='noload', back_populates='user'
    )

    @property
    def password(self):
        raise AttributeError('password not readable')

    @password.setter
    def password(self, password) -> None:
        self._password_hash = generate_password_hash(password)

    @property
    def is_admin(self):
        return self.role == UserRoles.admin

    @classmethod
    def find_by_username(cls, username: str) -> Optional["User"]:
        return cls.query.filter(cls.username == username).first()

    @classmethod
    def find_by_id(cls, _id: int) -> Optional["User"]:
        return cls.query.filter(cls.id == _id).first()

    @classmethod
    def find_by_external_id(cls, _id: str) -> Optional["User"]:
        return cls.query.filter(
            cls.external_id.is_not(None),
            cls.external_id == _id,
        ).first()

    def check_password(self, password: str) -> bool:
        return check_password_hash(self._password_hash, password)

    def __repr__(self):
        return f"User({self.id}, {self.username}, {self.name}, {self.role})"
