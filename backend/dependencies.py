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
    
    # Early validation: reject null, empty, or literal "null" string
    if not token or token.strip() == "" or token.lower() == "null":
        print(f"[AUTH AUDIT] Token validation failed: token is null or empty")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify the ID token while checking if the token is revoked.
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        # Surgical Log: Token Rx
        uid_preview = decoded_token.get('uid', 'UNKNOWN')[:6]
        print(f"[AUTH AUDIT] Token Received. UID_PREFIX={uid_preview}...")
        return decoded_token
    except ValueError as e:
        print(f"[AUTH AUDIT] Token Validation Failed: ValueError - {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch all Firebase auth errors (InvalidIdTokenError, ExpiredIdTokenError, etc.)
        print(f"[AUTH AUDIT] Token Validation Failed: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {type(e).__name__}",
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
        print(f"[AUTH AUDIT] JIT Provisioning Triggered for {email}")
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
        print(f"[AUTH AUDIT] JIT User Created -> ID: {user.id}")
    else:
        print(f"[AUTH AUDIT] Existing User Found -> ID: {user.id}")

    # 3. Validation
    # We allow the backend to trust Firebase's email_verified claim
    # Updating local state to match Firebase if changed (Lazy Sync)
    if user.is_verified != email_verified:
        print(f"[AUTH AUDIT] Syncing Verification Status. Neon={user.is_verified} -> Firebase={email_verified}")
        user.is_verified = email_verified
        db.commit()
    
    return user
