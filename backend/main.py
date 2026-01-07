from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from db_core import engine, Base
from api import auth, users, clinical_records, consultations, prescriptions

if not os.environ.get("PYTEST_CURRENT_TEST") and not os.environ.get("TESTING"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vitalinuage API", version="1.4.7")

app.include_router(auth.router, prefix="/api/auth")
app.include_router(users.router, prefix="/api/users")

@app.get("/api/health")
async def health_check():
    return {"status": "READY", "database": "connected"}