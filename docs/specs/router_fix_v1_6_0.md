# Especificación de Reparación de Rutas v1.6.0

## 1. Diagnóstico de "Sordera"
El backend sufre de dos problemas estructurales críticos:
1.  **Doble Prefijado:** `api/user.py` define `/api/user` y `main.py` lo incluye bajo `/api/users`.
    -   *Resultado:* `POST /api/users/api/user/onboarding` (404 si el frontend llama a lo lógico).
2.  **Rutas Fantasma:** Múltiples módulos defien `router = APIRouter(...)` pero **NUNCA** so importados en `main.py`.
    -   `patients.py`
    -   `consultations.py` (Main router + Verification router)
    -   `audit.py`
    -   `doctor.py`
    -   `medical_background.py`

## 2. Estrategia de Corrección

### A. Limpieza de Routers Individuales
Eliminar `prefix` de la definición del `APIRouter` dentro de los archivos individuales, delegando la responsabilidad de la ruta base a `main.py`.
-   *Excepción:* Rutas muy anidadas o específicas que se beneficien de tener el prefix local (ej. `/api/pacientes/{id}/consultas` en `consultations.py`), PERO debemos asegurar que `main.py` no le añada otro prefijo conflictivo.
-   **Decisión:** Estandarizar hacia "Prefijo en Main" para routers de primer nivel (`users`, `patients`, `audit`) y "Prefijo en Router" para anidados (`consultations`), montándolos en la raíz del `APIRouter` principal si es necesario, o simplemente `app.include_router(..., prefix="")` en main si el router ya trae su path completo.

### B. Mapeo Maestro (`main.py`)
El archivo `main.py` actuará como el "Switchboard" central.

| Módulo | Variable Router | Prefijo en `main.py` | Prefijo en Archivo (Estado Final) | URL Final |
| :--- | :--- | :--- | :--- | :--- |
| `auth` | `router` | `/api/auth` | `""` | `/api/auth/login` |
| `user` | `router` | `/api/users` | `""` | `/api/users/onboarding` |
| `doctor` | `router` | `/api/doctors` | `""` | `/api/doctors/profile` |
| `patients` | `router` | `/api/patients` | `""` | `/api/patients` |
| `consultations` | `router` | `""` | `/api/pacientes/{id}/consultas` | *(Se mantiene path completo)* |
| `consultations` | `verification_router` | `""` | `/api/consultas` | `/api/consultas/...` |
| `audit` | `router` | `/api/audit` | `""` | `/api/audit/dispatch-summary` |
| `medical_bg` | `router` | `""` | `/api/medical-background` | *(Revisar archivo)* |

## 3. Cambios Requeridos (Files-to-Touch)

### `backend/api/user.py`
-   Quitar `prefix="/api/user"`.

### `backend/api/patients.py`
-   Quitar `prefix="/api/patients"`.

### `backend/api/audit.py`
-   (Ya está limpio, verificar).

### `backend/main.py`
-   Importar todos los routers faltantes.
-   Incluir routers con los prefijos correctos según la tabla anterior.

## 4. Verificación
Crear un test `tests/test_routing_table.py` que inspeccione `app.routes` y verifique que las URLs críticas existan y sean correctas (sin duplicidades como `/api/api`).
