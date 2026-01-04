# Especificación de Contrato: Importación de Datos (Slice 07)

Este contrato define la estructura de respuesta para la carga masiva de pacientes mediante archivos CSV y especifica el formato esperado del archivo.

## 1. Backend Contract (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import List

class ImportError(BaseModel):
    fila: int = Field(..., description="Número de fila en el CSV (1-indexed)")
    error: str = Field(..., description="Descripción del error de validación")

class ImportResponse(BaseModel):
    total_procesados: int = Field(..., description="Total de filas leídas")
    exitosos: int = Field(..., description="Total de registros importados correctamente")
    fallidos: int = Field(..., description="Total de registros que fallaron")
    errores: List[ImportError] = Field(default=[], description="Lista detallada de errores")
```

## 2. CSV Specification

El archivo CSV debe cumplir con las siguientes columnas (validación estricta de encabezados):

| Columna | Requerido | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Nombre** | SÍ | Texto | Nombre del paciente |
| **Apellido** | SÍ | Texto | Apellido del paciente |
| **DNI** | SÍ | Texto | Documento de identidad único |
| **FechaNacimiento** | SÍ | Fecha | Formato YYYY-MM-DD |
| **Telefono** | NO | Texto | Número de contacto |
| **Email** | NO | Email | Correo electrónico |

*Nota: El sistema ignorará columnas adicionales no especificadas.*
