import os
import sys
import pytest

# --- Ensure project root is on path ---
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# --- Testing flags ---
os.environ["TESTING"] = "1"

# --- Force model registration ---
import backend.models  # noqa: F401

from backend.db_core import Base, engine, SessionLocal


@pytest.fixture(autouse=True, scope="function")
def db_setup():
    """
    Ensure all SQLAlchemy models are mapped and tables exist
    before each test, and clean after.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
