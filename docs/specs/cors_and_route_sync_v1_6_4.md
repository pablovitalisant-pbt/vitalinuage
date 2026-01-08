# Especificación de Sincronización de Rutas y CORS v1.6.4

## 1. Diagnóstico
El despliegue actual presenta un bloqueo de seguridad (CORS) y una desconexión semántica entre Frontend y Backend debido a la reciente profesionalización de rutas en v1.6.0.

### Hallazgos
1.  **CORS:** `backend/main.py` no implementa `CORSMiddleware`.
2.  **Ruta Doctor:** Frontend llama a `/api/doctor/*` (singular), Backend expone `/api/doctors/*` (plural).
3.  **Ruta Antecedentes:** Frontend llama a `/api/pacientes/{id}/antecedentes`, Backend expone `/api/medical-background/pacientes/{id}/antecedentes`.
4.  **Endpoint Fantasma:** Frontend solicita `/api/doctor/preferences`, el cual no existe en el Backend actual.

## 2. Plan de Acción

### A. Seguridad (Backend)
Implementar `CORSMiddleware` en `backend/main.py` para permitir tráfico legítimo.

**Configuración Permitida:**
```python
origins = [
    "http://localhost:5173",      # Desarrollo local
    "http://localhost:8080",      # Docker local
    "https://vitalinuage.web.app" # Producción
]
methods=["*"], headers=["*"]
```

### B. Mapeo de Sincronización (Frontend)
Actualizar los archivos del Frontend para consumir las rutas canónicas del Backend.

| Archivo Frontend | Ruta Vieja (Incorrecta) | Ruta Nueva (Correcta) |
| :--- | :--- | :--- |
| `DoctorContext.tsx` | `/api/doctor/profile` | `/api/doctors/profile` |
| `DoctorContext.tsx` | `/api/doctor/preferences` | `/api/doctors/preferences` (Stub requerido) |
| `DoctorContext.tsx` | `/api/doctor/onboarding/complete` | `/api/doctors/onboarding/complete` |
| `MedicalBackgroundManager.tsx` | `/api/pacientes/{id}/antecedentes` | `/api/medical-background/pacientes/{id}/antecedentes` |

### C. Backend Gap (Preferences)
Se detectó que `/api/doctors/preferences` no existe. Se debe crear un endpoint "stub" (placeholder) en `backend/api/doctor.py` para evitar errores 404 en el frontend, o eliminar la llamada si no es crítica.
*Decisión:* Implementar Stub en `doctor.py` que devuelva 200 OK y las preferencias por defecto.

## 3. Plan de Pruebas (Integration)
Crear `tests/test_cors_and_routes.py` para validar:
1.  **CORS:** Respuesta a `OPTIONS /api/health` con headers `Access-Control-Allow-Origin`.
2.  **Routes:**
    *   `GET /api/doctors/profile` -> 200/401 (No 404).
    *   `GET /api/medical-background/pacientes/1/antecedentes` -> 200/401 (No 404).
3.  **Stub Preferences:**
    *   `GET /api/doctors/preferences` -> 200/401.

## 4. Files-to-Touch
- `backend/main.py` (CORS)
- `backend/api/doctor.py` (Stub Preferences)
- `frontend/src/context/DoctorContext.tsx` (Rutas)
- `frontend/src/components/MedicalBackgroundManager.tsx` (Rutas)
