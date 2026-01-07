import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

if os.environ.get("PYTEST_CURRENT_TEST"):
    DATABASE_URL = "sqlite:///:memory:"

connect_args = {"check_same_thread": False} if not DATABASE_URL or "sqlite" in DATABASE_URL else {"sslmode": "require"}
if os.environ.get("PYTEST_CURRENT_TEST"):
    from sqlalchemy.pool import StaticPool
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
else:
    engine = create_engine(
        DATABASE_URL if DATABASE_URL else "sqlite:///./test.db", 
        connect_args=connect_args,
        pool_pre_ping=True
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
