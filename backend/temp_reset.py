from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
try:
    from database import get_db
    import crud
except ImportError:
    from .database import get_db
    from . import crud

router = APIRouter()

@router.post("/reset-password-temp")
def reset_password_temp(email: str, new_password: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password reset protocol initiated"}
