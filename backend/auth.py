from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import secrets
import hashlib

# CONFIG - Production-grade SECRET_KEY
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# SECURITY: Use bcrypt as the standard hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prehash_password(password: str) -> str:
    """
    Pre-hash password with SHA-256 to bypass bcrypt's 72-byte limit.
    This allows passwords of any length while maintaining security.
    """
    # Convert password to bytes and hash with SHA-256
    password_bytes = password.encode('utf-8')
    sha256_hash = hashlib.sha256(password_bytes).hexdigest()
    return sha256_hash

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using SHA-256 pre-hashing + bcrypt"""
    prehashed = _prehash_password(plain_password)
    return pwd_context.verify(prehashed, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 pre-hashing + bcrypt"""
    print(f"[AUTH] Original password length: {len(password)} bytes")
    prehashed = _prehash_password(password)
    print(f"[AUTH] After SHA-256 prehash length: {len(prehashed)} bytes (should be 64)")
    print(f"[AUTH] Prehashed value: {prehashed[:20]}...")
    bcrypt_hash = pwd_context.hash(prehashed)
    print(f"[AUTH] Bcrypt hash created successfully")
    return bcrypt_hash

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
