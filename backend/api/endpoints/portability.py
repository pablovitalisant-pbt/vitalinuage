
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import User
from backend.services.portability_service import PortabilityService
import io

router = APIRouter(prefix="/api/data", tags=["portability"])

@router.get("/export")
async def export_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        zip_bytes = PortabilityService.generate_export_zip(db, current_user.email)
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=vitalinuage_backup_{current_user.email}.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_data(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive (.zip)")
    
    try:
        contents = await file.read()
        stats = PortabilityService.process_import_zip(db, current_user.email, contents)
        return stats
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
