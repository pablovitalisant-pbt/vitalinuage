from pydantic import BaseModel, Field
from typing import List, Optional

class FieldConfig(BaseModel):
    field_key: str = Field(..., description="Clave interna del dato (ej: patient_name, diagnosis)")
    x_mm: float = Field(..., description="Posición X desde la izquierda en mm")
    y_mm: float = Field(..., description="Posición Y desde arriba en mm")
    font_size_pt: int = Field(10, description="Tamaño de fuente en puntos")
    max_width_mm: Optional[float] = Field(None, description="Ancho máximo antes de salto de línea o recorte")

class PrescriptionMapBase(BaseModel):
    name: str = Field(..., description="Nombre amigable del mapa (ej: Recetario Personal)")
    canvas_width_mm: float = Field(148.0, description="Ancho del papel (A5=148mm)")
    canvas_height_mm: float = Field(210.0, description="Alto del papel (A5=210mm)")
    fields_config: List[FieldConfig] = Field(..., description="Configuración de cada campo")
    is_active: bool = Field(True, description="Si es el mapa por defecto del médico")

class PrescriptionMapCreate(PrescriptionMapBase):
    pass

class PrescriptionMapResponse(PrescriptionMapBase):
    id: int
    doctor_id: str
    background_image_url: Optional[str] = None

    class Config:
        orm_mode = True
