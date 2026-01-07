from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db_core import engine, Base
from backend.core.config import settings
from backend.api import auth, users, clinical_records, consultations, prescriptions
from backend import migrate_bcrypt, temp_reset
import os

# Sincronización de esquema: 
if not os.environ.get("PYTEST_CURRENT_TEST") and not os.environ.get("TESTING"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(clinical_records.router, prefix="/api/records", tags=["Clinical"])
app.include_router(consultations.router, prefix="/api/consultations", tags=["Medical"])
app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Medical"])
app.include_router(migrate_bcrypt.router, prefix="/api/maintenance", tags=["Admin"])
app.include_router(temp_reset.router, prefix="/api/maintenance", tags=["Admin"])

@app.get("/api/health")
async def health_check():
    return {
        "status": "READY",
        "version": settings.VERSION,
        "database_connected": True,
        "environment": "production" if os.environ.get("K_SERVICE") else "development"
    }