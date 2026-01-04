# Especificación de Contrato: Integración de Notificaciones (Slice 06)

Este contrato define la estructura de datos para el envío de notificaciones push (simulando Firebase Cloud Messaging).

## 1. Backend Contract (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal

class NotificationRequest(BaseModel):
    usuario_id: str = Field(..., description="ID del usuario destino")
    titulo: str = Field(..., min_length=1, description="Título de la notificación")
    mensaje: str = Field(..., min_length=1, description="Cuerpo del mensaje")
    tipo: Literal['CITA_NUEVA', 'CITA_RECORDATORIO', 'RECETA', 'MARKETING'] = Field(..., description="Categoría estricta de la notificación")
    prioridad: Literal['ALTA', 'NORMAL'] = Field(..., description="Prioridad de entrega")
    data_payload: Optional[Dict[str, Any]] = Field(None, description="Datos adicionales JSON para la app")

class NotificationResponse(BaseModel):
    message_id: str
    status: str
```

## 2. Frontend Contract (Zod)

```typescript
import { z } from "zod";

export const NotificationSchema = z.object({
  usuario_id: z.string().min(1),
  titulo: z.string().min(1),
  mensaje: z.string().min(1),
  tipo: z.enum(["CITA_NUEVA", "CITA_RECORDATORIO", "RECETA", "MARKETING"]),
  prioridad: z.enum(["ALTA", "NORMAL"]),
  data_payload: z.record(z.any()).optional(),
});

export type NotificationRequest = z.infer<typeof NotificationSchema>;
```
