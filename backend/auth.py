from datetime import datetime
from typing import Optional
from fastapi import APIRouter
import os
import logging

# Setup logging
logger = logging.getLogger(__name__)

# LEGACY / UNUSED - Kept for constant references if any
SECRET_KEY = os.getenv("SECRET_KEY", "deprecated_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Empty Router - Endpoints removed to enforce Firebase Auth
router = APIRouter()

@router.on_event("startup")
async def startup_event():
    logger.info("AuthProvider: Local Auth endpoints are DEPRECATED. Using Firebase Auth.")

# Helper utilities kept just in case of obscure imports, but effectively disabled logic
# or simply removed if we are sure.
# For now, we leave them as stubs or remove them. 
# Given "Surgical", removing the endpoints is the key.

def get_password_hash(password: str) -> str:
    """DEPRECATED: Should not be used."""
    return "legacy_disabled"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """DEPRECATED: Should not be used."""
    return False

def create_access_token(data: dict, expires_delta: Optional[object] = None):
    """
    DEPRECATED: Used only for legacy tests. 
    New code should valid Firebase ID tokens.
    """
    # We return a dummy because this SHOULD fail if used against the new dependencies
    return "legacy_token_disabled"
