from sqlalchemy import Column, Integer, String, Boolean
from db_core import Base

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

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key) or key in self.__table__.columns:
                setattr(self, key, value)
        super().__init__()

class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
