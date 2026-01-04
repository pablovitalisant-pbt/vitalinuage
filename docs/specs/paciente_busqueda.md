# Especificación de Contrato: Búsqueda de Pacientes (Slice 03)

Este contrato define la búsqueda flexible de pacientes mediante un único campo de texto.

## 1. Backend Contract (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import List

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Texto de búsqueda (Nombre, Apellido, DNI)")

class PatientSummary(BaseModel):
    id: str
    nombre_completo: str
    dni: str
    imc: float
    # Campos adicionales para vista rápida si fueran necesarios

class PatientSummaryResponse(BaseModel):
    results: List[PatientSummary]
```

## 2. Frontend Contract (Zod)

```typescript
import { z } from "zod";

export const PatientSearchSchema = z.object({
  query: z.string().min(1, "Escriba al menos 1 caracter"),
});

export type PatientSearchQuery = z.infer<typeof PatientSearchSchema>;

export const PatientSummarySchema = z.object({
  id: z.string(),
  nombre_completo: z.string(),
  dni: z.string(),
  imc: z.number(),
});

export const PatientSearchResponseSchema = z.object({
    results: z.array(PatientSummarySchema)
});
```

## 3. Lógica de Negocio Esperada
El backend debe utilizar el parámetro `query` para filtrar en la base de datos (o mock) buscando coincidencias parciales (`contains` / `ilike`) en:
- `nombre`
- `apellido_paterno`
- `apellido_materno`
- `dni`

La búsqueda debe ser insensible a mayúsculas/minúsculas.
