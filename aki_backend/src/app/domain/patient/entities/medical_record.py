from os import path
from typing import Optional
from datetime import datetime
from sqlalchemy.sql import func

from config import Config
from app.core.generics import Column, Entity, db
from app.domain._shared.services.media_service import MediaService
from app.domain.user.entities.user import User


class MedicalRecord(Entity):
    __tablename__ = 'medical_records'

    def __init__(self, user_id: int, file, entry_date: Optional[datetime] = None):
        super(MedicalRecord, self).__init__()

        self.user_id = user_id
        self.file = file
        self.entry_date = entry_date

    def __repr__(self):
        return f"MedicalRecord({self.id}, {self.user_id}, {self._file_path}, {self.entry_date})"

    id = Column(db.Integer, primary_key=True)
    entry_date = Column(db.DateTime, server_default=func.now())
    user_id = Column(db.Integer, db.ForeignKey(User.id, ondelete="RESTRICT"))
    _file_path = Column("file_path", db.String(255))

    @property
    def file(self):
        return MediaService.get_media(self._file_path)
    
    @property
    def file_storage_path(self):
        return path.join(Config.APP_DIR, self.file)

    @file.setter
    def file(self, value):
        self._file_path = MediaService.set_media("medical_records", value)

    user = db.relationship('User', back_populates='medical_records', lazy='noload')
    patient_medical_records = db.relationship(
        "PatientMedicalRecord", back_populates='medical_record', lazy='noload'
    )
