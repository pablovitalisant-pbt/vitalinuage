import pytest
import os
import sys

os.environ["TESTING"] = "1"
os.environ["PYTEST_CURRENT_TEST"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db_core import Base, engine, SessionLocal

@pytest.fixture(autouse=True)
def memory_surgery():
    Base.registry.dispose()
    for table in Base.metadata.tables.values():
        table.indexes.clear()
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()