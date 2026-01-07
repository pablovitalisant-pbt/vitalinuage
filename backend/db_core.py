from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
import os
Base = declarative_base()
IS_TESTING = os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("TESTING")
if IS_TESTING:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
else:
    db_url = os.getenv("DATABASE_URL", "sqlite:///./vitalinuage.db")
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
def get_db():
    db = SessionLocal()
    try: yield db
    finally:
        if not IS_TESTING: db.close()
