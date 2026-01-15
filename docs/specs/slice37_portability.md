# Spec: Slice 37 - Data Portability Contracts

## 1. Data Models (CSV Structure)

The export will generate a ZIP containing two files.

### A. patients.csv
| Column | Type | Required | Description |
|---|---|---|---|
| dni | String | **Yes** | Unique Identifier (RUT) |
| nombre | String | **Yes** | First names |
| apellido_paterno | String | **Yes** | |
| apellido_materno | String | No | |
| fecha_nacimiento | Date | **Yes** | ISO-8601 (YYYY-MM-DD) |
| sexo | String | No | M/F/O |
| email | String | No | |
| telefono | String | No | |
| direccion | String | No | |
| antecedentes_morbidos | String | No | New-line separated text |

### B. consultations.csv
| Column | Type | Required | Description |
|---|---|---|---|
| patient_dni | String | **Yes** | FK to Patient DNI (Logical Link) |
| date | DateTime | **Yes** | ISO-8601 (YYYY-MM-DD HH:MM:SS) |
| motivo | String | **Yes** | |
| diagnostico | String | No | |
| tratamiento | String | No | |
| examen_fisico | String | No | |
| peso_kg | Float | No | |
| talla_cm | Float | No | |

## 2. API Endpoints

### GET /api/data/export
- **Auth**: Required (Bearer Token).
- **Start**: `task_boundary` not needed for simple GET.
- **Response**: `application/zip`.
- **Filename**: `vitalinuage_backup_{YYYYMMDD}.zip`

### POST /api/data/import
- **Auth**: Required.
- **Body**: `multipart/form-data`
    - `file`: `UploadFile` (Must be .zip)
- **Response**: `200 OK`
```json
{
  "patients_processed": 10,
  "patients_inserted": 8,
  "patients_skipped": 2,
  "consultations_processed": 15,
  "consultations_inserted": 15,
  "consultations_skipped": 0,
  "errors": []
}
```

## 3. Validation Rules (Ingress)
1.  **DNI Match**: Consultations must link to a valid DNI in `patients.csv` or an existing patient in DB.
2.  **Date Format**: Must be strictly ISO-8601 or common formats (DD/MM/YYYY).
3.  **Owner Safety**: All imported data is automatically assigned to the `current_user.email` (owner_id).
4.  **Quota**: Max file size 50MB (soft limit).

## 4. Security
- **Isolation**: Users can ONLY export their own rows (`WHERE owner_id = X`).
- **Sanitization**: CSV formulas (e.g. `=CMD(...)`) should be sanitized on Import to prevent injection if reopened in Excel, though less critical for backend. 
- **Strict Headers**: Import fails if required columns are missing.
