from pydantic import BaseModel
from typing import List

class PatientSearchResult(BaseModel):
    id: int
    nombre_completo: str
    dni: str
    imc: float

class PatientSearchResponse(BaseModel):
    results: List[PatientSearchResult]
