import pytest
import os
from backend.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Asegurar limpieza de metadatos al inicio de la sesión
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def clean_registry():
    # Limpiar el registro para evitar "Multiple classes found"
    from backend.database import Base
    Base.registry.dispose()
