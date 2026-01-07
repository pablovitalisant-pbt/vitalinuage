import os
from sqlalchemy import create_engine

DATABASE_URL = os.getenv("DATABASE_URL")

if os.getenv("IS_TESTING") == "true":
    DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
