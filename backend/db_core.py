from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool
import os
from core.config import settings

# Unified Testing Detection
IS_TESTING = os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("TESTING") == "1"

# Base definition - Single Source of Truth
Base = declarative_base()

# Engine definition
if IS_TESTING:
    # SQLITE EN MEMORIA + STATICPOOL: Imprescindible para que todos los hilos 
    # y el cliente de FastAPI compartan la misma base de datos volátil.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
else:
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or "sqlite:///./vitalinuage.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
    )
