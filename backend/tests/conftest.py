import pytest
import os
import sys

# Forzar variable de entorno antes de importar nada
os.environ["TESTING"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.db_core import Base, engine, SessionLocal
# Importar modelos para que Base los registre
from backend import models 

@pytest.fixture(autouse=True)
def memory_surgery():
    """Limpia el registro y arranca los índices para evitar colisiones"""
    Base.registry.dispose()
    for table in Base.metadata.tables.values():
        table.indexes.clear()
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.db_core import get_db

    def _get_test_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
