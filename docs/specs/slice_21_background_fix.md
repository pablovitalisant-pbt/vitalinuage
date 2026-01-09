# Contract Specification: Medical Background Fix (Slice 21)

## 1. Problem Diagnosis
- **Symptom:** "Error de conexión" in Medical Background styling.
- **Root Cause:** Frontend component `MedicalBackgroundManager.tsx` uses a relative URL (`/api/...`) instead of the absolute API URL helper (`getApiUrl`). this causes the request to be sent to the Frontend Server (Vite port 5173) instead of the Backend (Port 8000). Vite responds with `index.html` (Status 200), but `res.json()` fails with a SyntaxError, triggering the `catch` block.

## 2. Endpoint Specification

### GET Component
- **URL:** `/api/medical-background/pacientes/{patient_id}/antecedentes`
- **Method:** `GET`
- **Params:** `patient_id` (int)
- **Response (200 OK):**
```json
{
  "id": 1,
  "patient_id": 123,
  "patologicos": "string | null",
  "no_patologicos": "string | null",
  "heredofamiliares": "string | null",
  "quirurgicos": "string | null",
  "alergias": "string | null",
  "medicamentos_actuales": "string | null",
  "updated_at": "timestamp"
}
```

### PUT Component
- **URL:** `/api/medical-background/pacientes/{patient_id}/antecedentes`
- **Method:** `PUT`
- **Body:**
```json
{
  "patologicos": "string",
  "no_patologicos": "string",
  "heredofamiliares": "string",
  "quirurgicos": "string",
  "alergias": "string",
  "medicamentos_actuales": "string"
}
```
- **Response (200 OK):** Updated object (same schema as GET).

## 3. Implementation Plan
- **Backend:** specific endpoint does not need changes, it is correctly defined (albeit verbose).
- **Frontend:** Refactor `MedicalBackgroundManager.tsx` to import and use `getApiUrl` from `../config/api`.
