# Especificación de Contrato: Generación de Recetas Médicas (Slice 05)

Este contrato define la estructura de datos para la creación de una receta médica.

## 1. Backend Contract (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class Medicamento(BaseModel):
    nombre: str = Field(..., min_length=2, description="Nombre el medicamento")
    dosis: str = Field(..., description="Dosis (ej: 500mg)")
    frecuencia: str = Field(..., description="Frecuencia (ej: c/8h por 3 días)")

class RecetaCreate(BaseModel):
    consulta_id: str = Field(..., description="ID de la consulta vinculada")
    paciente_id: str = Field(..., description="ID del paciente")
    medicamentos: List[Medicamento] = Field(..., min_items=1, description="Lista de medicamentos")
    instrucciones_adicionales: Optional[str] = Field(None, description="Indicaciones generales")
    fecha_vencimiento: Optional[date] = Field(None, description="Fecha límite de validez")

class RecetaResponse(RecetaCreate):
    id: str
    fecha_emision: date
```

## 2. Frontend Contract (Zod)

```typescript
import { z } from "zod";

export const MedicamentoSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  dosis: z.string().min(1, "Dosis requerida"),
  frecuencia: z.string().min(1, "Frecuencia requerida"),
});

export const RecetaSchema = z.object({
  consulta_id: z.string().min(1),
  paciente_id: z.string().min(1),
  medicamentos: z.array(MedicamentoSchema).min(1, "Debe agregar al menos un medicamento"),
  instrucciones_adicionales: z.string().optional(),
  fecha_vencimiento: z.string().optional(), // String date (YYYY-MM-DD)
});

export type RecetaCreate = z.infer<typeof RecetaSchema>;
```
