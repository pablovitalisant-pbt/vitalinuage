import pytest, os, sys
import backend.models
os.environ["TESTING"] = "1"
os.environ["PYTEST_CURRENT_TEST"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from backend.db_core import Base, engine, SessionLocal
@pytest.fixture(autouse=True)
def db_setup():
    Base.registry.dispose()
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
@pytest.fixture
def db_session():
    session = SessionLocal(); yield session; session.close()
