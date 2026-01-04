# Especificación de Contrato: Registro de Consulta Médica (Slice 04)

Este contrato define la estructura de datos para el registro de una nueva consulta médica asociada a un paciente.

## 1. Backend Contract (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ConsultaCreate(BaseModel):
    paciente_id: str = Field(..., description="ID único del paciente")
    diagnostico: str = Field(..., min_length=3, description="Diagnóstico médico principal")
    examenes_solicitados: Optional[str] = Field(None, description="Lista de exámenes o texto libre")
    tratamiento: str = Field(..., min_length=3, description="Indicaciones y tratamiento")
    observaciones_privadas: Optional[str] = Field(None, description="Notas internas del médico, no visibles para paciente")

class ConsultaResponse(ConsultaCreate):
    id: str
    fecha_registro: datetime
```

## 2. Frontend Contract (Zod)

```typescript
import { z } from "zod";

export const ConsultaSchema = z.object({
  paciente_id: z.string().min(1, "Debe seleccionar un paciente"),
  diagnostico: z.string().min(3, "El diagnóstico es obligatorio"),
  examenes_solicitados: z.string().optional(),
  tratamiento: z.string().min(3, "El tratamiento es obligatorio"),
  observaciones_privadas: z.string().optional(),
});

export type ConsultaCreate = z.infer<typeof ConsultaSchema>;
```
