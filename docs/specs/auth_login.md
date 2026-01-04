# Especificación de Contrato: Auth Login (Slice 01)

Este documento define los contratos de datos para la autenticación del médico.

## 1. Backend Contract (Pydantic)

El backend utilizará `pydantic` para validar las peticiones entrantes y estructurar las respuestas.

```python
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico del médico")
    password: str = Field(..., min_length=8, description="Contraseña del usuario")

class UserProfile(BaseModel):
    id: str
    name: str
    role: str = "doctor"

class LoginResponse(BaseModel):
    token: str
    user: UserProfile
```

## 2. Frontend Contract (Zod)

El frontend utilizará `zod` para validar formularios y respuestas de la API.

```typescript
import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email("Debe ser un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().default("doctor"),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserProfileSchema,
});

// Tipos inferidos
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
```
