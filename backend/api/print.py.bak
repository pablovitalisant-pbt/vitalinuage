from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from backend from backend import models
from database import get_db
from dependencies import get_current_user
from services.pdf_service import PDFService

router = APIRouter(
    prefix="/api/consultas",
    tags=["impresion"]
)


@router.get("/{consultation_id}/pdf")
async def generate_prescription_pdf(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Genera PDF de receta médica para una consulta.
    
    - **consultation_id**: ID de la consulta clínica
    - **Autenticación**: Requiere JWT token
    - **Autorización**: Solo el médico dueño de la consulta puede generar el PDF
    
    Returns:
        PDF file (application/pdf)
    
    Raises:
        404: Consulta no encontrada
        403: Usuario no autorizado
    """
    # 1. Obtener consulta
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # 2. Verificar autorización (owner_id debe coincidir con el usuario autenticado)
    if consultation.owner_id != current_user.email:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 3. Generar PDF
    pdf_bytes = PDFService.generate_prescription_pdf(
        consultation=consultation,
        doctor_email=current_user.email,
        db=db
    )
    
    # 4. Retornar PDF
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=receta_{consultation_id}.pdf"
        }
    )
