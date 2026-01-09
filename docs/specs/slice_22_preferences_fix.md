# Contract Specification: Doctor Preferences Fix (Slice 22)

## 1. Problem Diagnosis
- **Symptom:** `ERR_CONNECTION_CLOSED` or 422 Unprocessable Entity (silent).
- **Root Cause:** The Frontend sends a JSON body to `PUT /api/doctors/preferences`, but the Backend `update_preferences` function (lines 248-250) **does not accept any body argument**. It only accepts `current_user`.
- **Mechanism:** FastAPI returns a 422 Validation Error when extra data is sent but not expected/defined in the schema, or sometimes the connection drops if the request is malformed.

## 2. Endpoint Specification

### GET Component
- **URL:** `/api/doctors/preferences`
- **Method:** `GET`
- **Response (200 OK):**
```json
{
  "paper_size": "A4",
  "template_id": "classic",
  "header_text": "string",
  "footer_text": "string",
  "primary_color": "#000000",
  "secondary_color": "#ffffff",
  "logo_url": "string | null",
  "signature_url": "string | null"
}
```

### PUT Component
- **URL:** `/api/doctors/preferences`
- **Method:** `PUT`
- **Body (Required):**
```json
{
  "paper_size": "A4" | "Letter",
  "template_id": "classic" | "modern" | "minimal",
  "header_text": "string (optional)",
  "footer_text": "string (optional)",
  "primary_color": "string (optional)",
  "secondary_color": "string (optional)"
}
```
- **Response (200 OK):** Updated object or `{"status": "success"}`.

## 3. Implementation Plan
- **Backend:** Update `update_preferences` in `backend/api/doctor.py` to accept a Pydantic model (`DoctorPreferencesUpdate`).
- **Frontend:** No changes needed (already sending correct data).
