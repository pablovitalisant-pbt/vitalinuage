
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_user
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
        # MANUAL CASCADING DELETE (Due to String owner_id and no FK constraints)
        
        # 1. Delete Consultations
        # Use synchronize_session=False for bulk delete performance
        db.query(ClinicalConsultation).filter(ClinicalConsultation.owner_id == current_user.email).delete(synchronize_session=False)
        
        # 2. Delete Patients
        db.query(Patient).filter(Patient.owner_id == current_user.email).delete(synchronize_session=False)
        
        # Consider deleting Prescriptions/Maps if needed?
        # Slice 38 spec didn't strictly list them, but we should be clean.
        # Stub model Prescription has doctor_id.
        db.query(Prescription).filter(Prescription.doctor_id == current_user.email).delete(synchronize_session=False)

        # 3. Delete User
        db.delete(current_user)
        
        db.commit()
        
        return {"message": "Cuenta eliminada correctamente via eliminación en cascada manual."}
        
    except Exception as e:
        db.rollback()
        print(f"Delete Account Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error crítico al eliminar la cuenta. Contacte soporte."
        )
