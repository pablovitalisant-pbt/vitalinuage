from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud
import auth
from database import get_db

router = APIRouter()

# Temporary password reset endpoint - REMOVE IN PRODUCTION
@router.post("/reset-password-temp")
def reset_password_temp(email: str, new_password: str, db: Session = Depends(get_db)):
    """
    Temporary endpoint to reset a user's password.
    USE ONLY FOR DEBUGGING - REMOVE IN PRODUCTION
    """
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash the new password
    new_hashed_password = auth.get_password_hash(new_password)
    user.hashed_password = new_hashed_password
    db.commit()
    
    print(f"[RESET] Password reset for {email}")
    print(f"[RESET] New hash: {new_hashed_password[:20]}...")
    
    return {"message": "Password reset successfully", "email": email}
