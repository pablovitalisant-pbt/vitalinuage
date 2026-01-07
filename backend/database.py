from sqlalchemy.orm import sessionmaker
from backend.db_core import Base, engine, IS_TESTING

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        # En modo test no cerramos agresivamente para evitar ResourceClosedError
        if not IS_TESTING:
            db.close()
