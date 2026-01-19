from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend import crud
from backend.database import get_db
import firebase_admin
from firebase_admin import auth as firebase_auth
from backend import models
from backend.core.firebase_app import initialize_firebase # Ensure init logic exists

# Initialize Firebase on module load if likely needed, or rely on main.py
# initialize_firebase() # Better to do in main.py startup

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify the ID token while checking if the token is revoked.
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        return decoded_token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.AuthError as e:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase Auth Error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token), 
    db: Session = Depends(get_db)
):
    """
    Validates Firebase Token and retrieves/creates local User.
    JIT Provisioning: If user doesn't exist in Neon, create them based on Firebase Identity.
    """
    uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    email_verified = decoded_token.get("email_verified", False)
    
    if not email:
        raise HTTPException(status_code=400, detail="Token must contain email")

    # 1. Try to find user in DB
    user = crud.get_user_by_email(db, email=email)
    
    # 2. JIT Provisioning if not exists
    if not user:
        # Create user without password (legacy field)
        # We trust Firebase for authentication, so we create the shadow user in Neon
        user = models.User(
            email=email,
            hashed_password=None, # LEGACY: No password stored locally
            is_verified=email_verified,
            professional_name="Doctor" # Default placeholder
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 3. Validation
    # We allow the backend to trust Firebase's email_verified claim
    # Updating local state to match Firebase if changed (Lazy Sync)
    if user.is_verified != email_verified:
        user.is_verified = email_verified
        db.commit()
    
    # Optional: Enforce verification if strictly required by business logic
    # if not user.is_verified:
    #     raise HTTPException(status_code=403, detail="Email not verified")

    return user
