from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class PatientBase(BaseModel):
    # Identificación
    nombre: str = Field(..., min_length=2)
    apellido_paterno: str = Field(..., min_length=1)
    apellido_materno: Optional[str] = None
    dni: str = Field(..., min_length=1)
    fecha_nacimiento: str # ISO format string YYYY-MM-DD
    sexo: str = "M" 

    # Contacto
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None

    # Datos Sociales
    ocupacion: Optional[str] = None
    estado_civil: Optional[str] = None

    # Antropometría
    peso: float = 0
    talla: float = 0
    imc: float = 0

    # Extras
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None
    observaciones: Optional[str] = None
    
    # Multitenancy
    owner_id: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class PatientUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    dni: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    
    ocupacion: Optional[str] = None
    estado_civil: Optional[str] = None
    
    peso: Optional[float] = None
    talla: Optional[float] = None
    imc: Optional[float] = None
    
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None
    observaciones: Optional[str] = None
