# 01 Multitenancy Contract Specification

## 1. Objetivo
Implementar el aislamiento de datos (Multitenancy) asegurando que cada paciente esté vinculado a un médico específico mediante un `owner_id`.

## 2. Archivos Afectados

### Backend
*   `backend/schemas/patients.py` (Nuevo Archivo): Definición del esquema Pydantic.

### Frontend
*   `frontend/src/contracts/paciente.ts` (Modificación): Actualización del esquema Zod.

### Configuración
*   `config/feature-flags.json` (Modificación): Flag para habilitar el aislamiento.

## 3. Especificación del Contrato

### 3.1 Backend: `backend/schemas/patients.py`
Se creará este archivo para definir el modelo de datos que valida la entrada y salida de pacientes.

```python
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
    
    # Multitenancy (Nuevo)
    owner_id: str

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
```

### 3.2 Frontend: `frontend/src/contracts/paciente.ts`
Se actualizará el esquema Zod para incluir `ownerId`. Nota: Se asume que habrá una transformación o mapeo de `ownerId` (camelCase en frontend) a `owner_id` (snake_case en backend) en la capa de servicios, o se utilizará `ownerId` consistentemente si el backend lo permite. Dado el requerimiento explícito, se añade como `ownerId`.

```typescript
import { z } from "zod";

export const PacienteSchema = z.object({
    // Identificación
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    apellido_paterno: z.string().min(1, "Mínimo 1 caracter"),
    apellido_materno: z.string().optional(),
    dni: z.string().min(1, "DNI requerido"),
    fecha_nacimiento: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
        message: "Fecha de nacimiento inválida",
    }),
    sexo: z.string().default("M"),

    // Contacto
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),

    // Datos Sociales
    ocupacion: z.string().optional(),
    estado_civil: z.string().optional(),

    // Antropometría
    peso: z.number().default(0),
    talla: z.number().default(0),
    imc: z.number().default(0),

    // Extras
    grupo_sanguineo: z.string().optional(),
    alergias: z.string().optional(),
    observaciones: z.string().optional(),

    // Multitenancy (Nuevo)
    ownerId: z.string(),
});

export type PacienteCreate = z.infer<typeof PacienteSchema>;
```

### 3.3 Feature Flags: `config/feature-flags.json`
Se añadirá un flag para controlar la activación de esta restricción.

```json
{
    // ... flags existentes ...
    "enable_multitenancy": false
}
```

## 4. Preguntas / Clarificaciones
*   **Convención de Nombres**: El backend usa `owner_id` (snake_case) y el frontend `ownerId` (camelCase). ¿Se debe implementar un serializador/deserializador (alias) en Pydantic para manejar esto automáticamente, o se prefiere usar `owner_id` en el frontend también para simplificar? Por ahora se respeta la instrucción literal.
*   **Validación de Owner**: ¿El `owner_id` debe ser validado contra la tabla de usuarios existentes en esta fase, o solo se requiere la presencia del campo string?
