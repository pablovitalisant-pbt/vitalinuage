# Slice 15.1 Specifications: A5 Printing & Logo

## 1. Data Models (Backend - SQLAlchemy)

### `DoctorPreferences`
Stored in `doctor_preferences` table. One-to-one with `Doctor`.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | UUID |
| `doctor_id` | String (FK) | Links to `doctors.id` |
| `paper_size` | String | Options: "A4", "A5". Default: "A4" |
| `template_id` | String | Options: "minimal", "modern", "classic". Default: "classic" |
| `logo_path` | String | Relative path to stored image file. Nullable. |
| `header_text` | String | Custom text for top of page. Nullable. |
| `footer_text` | String | Custom text for bottom of page. Nullable. |
| `updated_at` | DateTime | Timestamp of last change. |

## 2. Pydantic Schemas

```python
from enum import Enum
from pydantic import BaseModel
from typing import Optional

class PaperSize(str, Enum):
    A4 = "A4"
    A5 = "A5"

class TemplateStyle(str, Enum):
    MINIMAL = "minimal"
    MODERN = "modern"
    CLASSIC = "classic"

class PrintPreferencesBase(BaseModel):
    paper_size: PaperSize = PaperSize.A4
    template_id: TemplateStyle = TemplateStyle.CLASSIC
    header_text: Optional[str] = None
    footer_text: Optional[str] = None
    # Logo is handled separately via upload or path reference

class PrintPreferencesUpdate(PrintPreferencesBase):
    pass

class PrintPreferencesResponse(PrintPreferencesBase):
    logo_url: Optional[str] = None # Constructed URL for frontend
```

## 3. API Endpoints

### `GET /api/doctor/preferences`
- **Auth**: Required (Dr. Context)
- **Response**: `PrintPreferencesResponse`
- **Behavior**: Returns current settings. If none exist, creates default.

### `PUT /api/doctor/preferences`
- **Body**: `PrintPreferencesUpdate`
- **Response**: `PrintPreferencesResponse`
- **Behavior**: Updates fields.

### `POST /api/doctor/logo`
- **Body**: `multipart/form-data` (`file`)
- **Response**: `{ "status": "success", "logo_url": "/static/uploads/logo_123.png" }`
- **Behavior**: 
    1. Validates image type (png, jpg).
    2. Saves to `backend/static/uploads/`.
    3. Updates `doctor_preferences.logo_path`.

## 4. Frontend Integration
- **Button Location**: Modal "Detalle de Consulta" -> Footer.
- **Label**: "Imprimir Receta" (Icon: Printer).
- **Action**: Opens a specific Print View or generates PDF based on `template_id`.

## 5. Persistence
- Use `vitalinuage.db` (SQLite).
- Need to ensure `alembic` or manual syncing is done for new table.
