from sqlalchemy import Column, Integer, String, Boolean
from backend.db_core import Base
class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    professional_name = Column(String, nullable=False)
    specialty = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_onboarded = Column(Boolean, default=False)
    registration_number = Column(String, nullable=True)
    def __init__(self, **kwargs):
        for k, v in kwargs.items(): setattr(self, k, v)
class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, nullable=True)
class ClinicalConsultation(Base):
    __tablename__ = "consultations"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer)
    doctor_id = Column(Integer)
    reason = Column(String)
class PrescriptionVerification(Base):
    __tablename__ = "verifications"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer)
    doctor_email = Column(String)
    verification_uuid = Column(String)
