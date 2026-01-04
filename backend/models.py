from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    nombre = Column(String, index=True, nullable=False)
    apellido_paterno = Column(String, index=True, nullable=False)
    apellido_materno = Column(String, nullable=True)
    dni = Column(String, unique=True, index=True, nullable=False)
    fecha_nacimiento = Column(String, nullable=False) 
    sexo = Column(String, default="M")

    # Contacto
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    direccion = Column(String, nullable=True)

    # Datos Sociales
    ocupacion = Column(String, nullable=True)
    estado_civil = Column(String, nullable=True)

    # Antropometría
    peso = Column(Float, default=0.0)
    talla = Column(Float, default=0.0)
    imc = Column(Float, default=0.0)
    
    # Extras
    grupo_sanguineo = Column(String, nullable=True)
    alergias = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)

    # Multitenancy
    owner_id = Column(String, index=True, nullable=False)
