from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os
import secrets
import hashlib
import bcrypt
import logging

# Setup logging
logger = logging.getLogger(__name__)

# CONFIG - Production-grade SECRET_KEY
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
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
