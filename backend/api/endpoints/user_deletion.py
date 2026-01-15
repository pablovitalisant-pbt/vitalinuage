
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_user
from sqlalchemy import text
from backend.models import User, Patient, ClinicalConsultation, Prescription

router = APIRouter()

@router.delete("/api/users/me", status_code=status.HTTP_200_OK)
async def delete_account(
    confirmation_phrase: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete the user account and all Cascade Data.
    Security: Requires exact confirmation phrase.
    """
    expected_phrase = f"eliminar mi cuenta vitalinuage/{current_user.email}"
    
    if confirmation_phrase != expected_phrase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La frase de confirmación es incorrecta."
        )

    try:
        # MANUAL CASCADING DELETE (HOTFIX: Use SQL for complex subqueries and FK resolution)
        
        # 1. Borrar verificaciones QR (Dependencia de Consultas)
        db.execute(
            text("""
            DELETE FROM prescription_verifications 
            WHERE consultation_id IN (
                SELECT id FROM clinical_consultations WHERE owner_id = :email
            )
            """), 
            {"email": current_user.email}
        )

        # 2. CAPA 2 (Hijos Directos)
        # A. Borrar Consultas
        # Also clean up stub prescriptions if needed
        db.execute(
            text("DELETE FROM prescriptions WHERE doctor_id = :email"),
            {"email": current_user.email}
        )
        
        db.execute(
            text("DELETE FROM clinical_consultations WHERE owner_id = :email"),
            {"email": current_user.email}
        )
        
        # B. Borrar Antecedentes Médicos (Dependencia de Pacientes)
        db.execute(
            text("""
            DELETE FROM medical_backgrounds 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE owner_id = :email
            )
            """), 
            {"email": current_user.email}
        )
        
        # 3. CAPA 1 (Entidades Principales)
        # Borrar Pacientes
        db.execute(
            text("DELETE FROM patients WHERE owner_id = :email"),
            {"email": current_user.email}
        )

        # 4. CAPA 0 (Raíz)
        # Borrar Usuario
        db.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": current_user.email}
        )

        
        db.commit()
        
        return {"message": "Cuenta eliminada correctamente via eliminación en cascada manual."}
        
    except Exception as e:
        db.rollback()
        print(f"Delete Account Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error crítico al eliminar la cuenta. Contacte soporte."
        )
