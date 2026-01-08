from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os
import secrets
import hashlib
import bcrypt
import logging
import uuid
from backend.services.email_service import EmailService

# Setup logging
logger = logging.getLogger(__name__)

# CONFIG - Production-grade SECRET_KEY
# Ensure consistency for tests by defaulting to a fixed key if not env provided
SECRET_KEY = os.getenv("SECRET_KEY", "test_secret_key_fixed_for_consistency")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

def _prehash_password(password: str) -> str:
    """
    Pre-hash password with SHA-256 to bypass bcrypt's 72-byte limit.
    This allows passwords of any length while maintaining security.
    """
    logger.info(f"[AUTH] Pre-hashing password of length: {len(password)}")
    password_bytes = password.encode('utf-8')
    sha256_hash = hashlib.sha256(password_bytes).hexdigest()
    logger.info(f"[AUTH] SHA-256 hash created: {sha256_hash[:20]}... (length: {len(sha256_hash)})")
    return sha256_hash

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using SHA-256 pre-hashing + bcrypt"""
    try:
        prehashed = _prehash_password(plain_password)
        prehashed_bytes = prehashed.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        result = bcrypt.checkpw(prehashed_bytes, hashed_bytes)
        logger.info(f"[AUTH] Password verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"[AUTH] Password verification failed: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 pre-hashing + bcrypt - ATOMIC VERSION"""
    try:
        logger.info(f"[AUTH] ===== ATOMIC HASH FUNCTION CALLED =====")
        logger.info(f"[AUTH] Original password length: {len(password)} bytes")
        
        # ATOMIC FIX: Pre-hash with SHA-256 FIRST
        prehashed = _prehash_password(password)
        logger.info(f"[AUTH] Prehashed length: {len(prehashed)} bytes (MUST be 64)")
        
        if len(prehashed) != 64:
            logger.error(f"[AUTH] CRITICAL: Prehash is not 64 bytes! Got {len(prehashed)}")
            raise ValueError(f"SHA-256 hash should be 64 bytes, got {len(prehashed)}")
        
        # Convert to bytes for bcrypt
        prehashed_bytes = prehashed.encode('utf-8')
        logger.info(f"[AUTH] Encoded to bytes, length: {len(prehashed_bytes)}")
        
        # Generate salt and hash with bcrypt
        salt = bcrypt.gensalt()
        bcrypt_hash = bcrypt.hashpw(prehashed_bytes, salt)
        
        # Convert back to string for storage
        hash_string = bcrypt_hash.decode('utf-8')
        logger.info(f"[AUTH] Bcrypt hash created successfully: {hash_string[:30]}...")
        logger.info(f"[AUTH] ===== HASH COMPLETE =====")
        
        return hash_string
        
    except Exception as e:
        logger.error(f"[AUTH] FATAL ERROR in get_password_hash: {type(e).__name__}: {str(e)}")
        raise

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Router Definition (Fix for main.py import)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import schemas
from backend import models
from backend.schemas import auth_schemas

router = APIRouter()

@router.post("/login", response_model=auth_schemas.Token)
def login_for_access_token(
    form_data: auth_schemas.UserLogin, 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", status_code=201, response_model=auth_schemas.UserCreateResponse)
def register(
    user: auth_schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # 1. Check if email exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # 2. Hash password & Create User
    hashed_pwd = get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        # Default flags
        # is_active removed as per model definition
        is_verified=False,
        verification_token=verification_token,
        professional_name="Dr. " # Placeholder
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Send Verification Email
    # We call this asynchronously ideally, but synchronous for MVP is acceptable given low volume
    EmailService.send_verification_email(
        to_email=new_user.email,
        verification_token=verification_token,
        professional_name=new_user.professional_name or "Doctor"
    )
    
    return {"message": "User created successfully", "email": new_user.email}

@router.get("/verify", status_code=200)
def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    # 1. Find user with verification_token
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado"
        )
    
    # 2. Verify user
    user.is_verified = True
    user.verification_token = None # Invalidate token (One-time use)
    
    db.commit()
    
    return {"message": "Email verificado correctamente"}
