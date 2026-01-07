import pytest, os, sys
os.environ["TESTING"] = "1"
os.environ["PYTEST_CURRENT_TEST"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from backend.db_core import Base, engine, SessionLocal
@pytest.fixture(autouse=True)
def db_setup():
    Base.registry.dispose()
    Base.metadata.create_all(bind=engine)
    yield
@pytest.fixture
def db_session():
    session = SessionLocal(); yield session; session.close()
@pytest.fixture
def client(db_session):
    from fastapi.testclient import TestClient; from backend.main import app; from backend.db_core import get_db
    def _get_test_db(): yield db_session
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c: yield c
    app.dependency_overrides.clear()
