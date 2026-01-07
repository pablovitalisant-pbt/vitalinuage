from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
import os
from core.config import settings

# Unified Testing Detection
IS_TESTING = os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("TESTING")

if IS_TESTING:
    # Pure in-memory SQLite with StaticPool query
    SQLALCHEMY_DATABASE_URL = "sqlite://"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
else:
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
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
        # Guard: Do not close in testing to prevent ResourceClosedError with StaticPool
        # if the connection is shared and managed by the fixture.
        if not IS_TESTING:
            db.close()
