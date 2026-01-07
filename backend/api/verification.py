from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend from backend import models
from database import get_db
import datetime

router = APIRouter(
    prefix="/v",
    tags=["verificacion"]
)


@router.get("/{verification_uuid}")
async def verify_prescription(
    verification_uuid: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint público de verificación de recetas.
    
    - **verification_uuid**: UUID único de la receta
    - **Sin autenticación**: Accesible para farmacias
    
    Returns:
        Datos públicos de verificación
    """
    # Buscar registro de verificación
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.uuid == verification_uuid
    ).first()
    
    if not verification:
        raise HTTPException(status_code=404, detail="Receta no encontrada o inválida")
    
    # Actualizar contador de escaneos
    verification.scanned_count += 1
    verification.last_scanned_at = datetime.datetime.utcnow()
    db.commit()
    
    # Retornar datos públicos (SIN datos del paciente)
    return {
        "valid": True,
        "doctor_name": verification.doctor_name,
        "issue_date": verification.issue_date.strftime('%d/%m/%Y'),
        "verification_message": "Esta receta fue emitida por un médico verificado en Vitalinuage.",
        "scanned_count": verification.scanned_count
    }


@router.get("/{verification_uuid}/pdf")
async def download_prescription_pdf(
    verification_uuid: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint público para descargar PDF de receta verificada.
    
    - **verification_uuid**: UUID de la verificación
    - **Sin autenticación**: Accesible para pacientes
    
    Returns:
        PDF file (application/pdf)
    
    Raises:
        404: Receta no encontrada
    """
    from fastapi.responses import Response
    from services.pdf_service import PDFService
    import tempfile
    import os
    
    # 1. Buscar verificación
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.uuid == verification_uuid
    ).first()
    
    if not verification:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    
    # 2. Obtener consulta
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == verification.consultation_id
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    # 3. Obtener mapa del médico (si existe)
    prescription_map = db.query(models.PrescriptionMap).filter(
        models.PrescriptionMap.doctor_id == verification.doctor_email,
        models.PrescriptionMap.is_active == True
    ).first()
    
    # 4. Generar PDF
    if prescription_map:
        # Con coordenadas personalizadas
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            pdf_bytes = PDFService.generate_with_coordinates(
                consultation, 
                prescription_map, 
                tmp.name,
                db=db
            )
            # Cleanup temp file
            try:
                os.unlink(tmp.name)
            except:
                pass
    else:
        # Template estándar
        pdf_bytes = PDFService.generate_with_template(consultation)
    
    # 5. Incrementar contador de descargas
    verification.scanned_count += 1
    db.commit()
    
    # 6. Retornar PDF
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=receta_{verification.doctor_name.replace(' ', '_')}.pdf"
        }
    )
