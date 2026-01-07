from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import StaticPool
import os
from core.config import settings

# Detección redundante de modo test
IS_TESTING = os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("TESTING") == "1"

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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        # En modo test no cerramos agresivamente para evitar ResourceClosedError
        if not IS_TESTING:
            db.close()
