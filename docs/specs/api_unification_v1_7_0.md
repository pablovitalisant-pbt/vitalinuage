# Especificación de Unificación de API v1.7.0

## 1. Diagnóstico de Inconsistencias (Diccionario de Sincronización)

Este documento detalla todas las discrepancias encontradas entre las peticiones del Frontend y los endpoints expuestos por el Backend.

| Contexto / Archivo Frontend | Ruta Solicitada (FE) | Ruta Existente (BE) | Diagnóstico | Acción Requerida |
| :--- | :--- | :--- | :--- | :--- |
| **Auth / Login.tsx** | `POST /register` | *Ninguna* | **CRÍTICO:** Endpoint no existe. | Crear endpoint `POST /api/auth/register`. |
| **Auth / Login.tsx** | `POST /login` | `POST /api/auth/login` | **INCONSISTENTE:** Prefijo incorrecto. | Actualizar FE a `/api/auth/login`. |
| **Pacientes / patientService.ts** | `GET /api/pacientes` | `GET /api/patients` | **INCONSISTENTE:** Idioma (Esp/Ing). | Actualizar FE a `/api/patients`. |
| **Pacientes / patientService.ts** | `GET /api/pacientes/search` | `GET /api/patients/search` | **INCONSISTENTE:** Idioma. | Actualizar FE a `/api/patients/search`. |
| **Consultas / (Varios)** | `/api/pacientes/{id}/consultas` | `/api/pacientes/{id}/consultas` | **LEGACY:** Idioma mixto (path params). | *Diferido a v1.8.0 para no romper compatibilidad ahora.* |

## 2. Propuesta de Estandarización
Para la versión v1.7.0, se establece la norma: **Inglés + Plural**.

*   `/api/doctors` (Ya implementado)
*   `/api/patients` (Objetivo de esta migración)
*   `/api/auth` (Objetivo de corrección de prefijos)

## 3. Plan de Registro (Nuevo Endpoint)

El Frontend requiere un mecanismo de registro. Se implementará en `backend/auth.py`.

**Especificación Técnica:**
*   **Método:** `POST`
*   **Ruta:** `/api/auth/register`
*   **Schema (Input):** `UserCreate` (email, password, professional_name).
*   **Comportamiento:**
    1.  Verificar si el email ya existe. Si sí -> 400 Bad Request.
    2.  Hashear password.
    3.  Crear usuario con `is_active=True` (Simplificado por ahora) o `is_verified=False`.
    4.  Retornar Token de acceso (Auto-login) O mensaje de éxito.
    *   *Decisión Frontend (`Login.tsx`):* El frontend espera un mensaje de "Cuenta creada, verifica tu email". No hace auto-login.
    *   *Respuesta BE:* 201 Created + `{ "message": "User created", "email": "..." }`.

## 4. Plan de Ejecución (Slice 10)

1.  **Backend (`auth.py`):** Implementar `register`.
2.  **Frontend (`Login.tsx`):** Corregir endpoints a `/api/auth/register` y `/api/auth/login`.
3.  **Frontend (`patientService.ts`):** Corregir endpoints a `/api/patients`.

## 5. Validación
*   Test `tests/test_api_unification.py` que verifique la existencia de `/api/auth/register` y `/api/patients`.
