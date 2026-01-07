import pytest
import os

# Force testing environment variable
os.environ["TESTING"] = "1"

from backend.database import Base, engine

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """
    Lifecycle Manager:
    Ensures that for every single test function, the database tables are created fresh.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    
@pytest.fixture(autouse=True)
def clean_registry():
    """
    Clean up SQLAlchemy registry to prevent 'Multiple classes found' errors.
    """
    from backend.database import Base
    Base.registry.dispose()
