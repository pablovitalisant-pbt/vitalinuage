# Especificación de Contrato: Registro de Pacientes (Slice 02)

Este contrato define la estructura de datos para el registro de nuevos pacientes (17 campos).

## 1. Backend Contract (Pydantic)

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import date

class PacienteCreate(BaseModel):
    # Identificación
    nombre: str = Field(..., min_length=2, max_length=50)
    apellido_paterno: str = Field(..., min_length=2, max_length=50)
    apellido_materno: str = Field(..., min_length=2, max_length=50)
    dni: str = Field(..., min_length=8, max_length=12)
    fecha_nacimiento: date
    sexo: str = Field(..., pattern="^(M|F)$")
    
    # Contacto
    telefono: str = Field(..., min_length=9, max_length=15)
    email: Optional[EmailStr] = None
    direccion: str = Field(..., max_length=100)
    
    # Datos Sociales
    ocupacion: Optional[str] = None
    estado_civil: Optional[str] = None
    
    # Antropometría Inicial
    peso: float = Field(..., gt=0, description="Peso en KG")
    talla: float = Field(..., gt=0, description="Talla en CM")
    imc: float = Field(..., gt=0, description="Índice de Masa Corporal")
    
    # Extra / Metadatos (Completar hasta 17 campos)
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None
    observaciones: Optional[str] = None

class PacienteResponse(PacienteCreate):
    id: str
    fecha_registro: date
```

## 2. Frontend Contract (Zod)

```typescript
import { z } from "zod";

export const PacienteSchema = z.object({
  // Identificación
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido_paterno: z.string().min(2, "Mínimo 2 caracteres"),
  apellido_materno: z.string().min(2, "Mínimo 2 caracteres"),
  dni: z.string().min(8, "DNI inválido"),
  fecha_nacimiento: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
    message: "Fecha de nacimiento inválida",
  }),
  sexo: z.enum(["M", "F"]),

  // Contacto
  telefono: z.string().min(9, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().min(5, "Dirección muy corta"),

  // Datos Sociales
  ocupacion: z.string().optional(),
  estado_civil: z.string().optional(),

  // Antropometría
  peso: z.number().positive("El peso debe ser positivo"),
  talla: z.number().positive("La talla debe ser positiva"),
  imc: z.number().positive(), # Calculado automáticamente en Frontend usualmente

  // Extras
  grupo_sanguineo: z.string().optional(),
  alergias: z.string().optional(),
  observaciones: z.string().optional(),
});

export type PacienteCreate = z.infer<typeof PacienteSchema>;
```
