from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from sqlalchemy import text
from backend.db_core import engine, Base
from backend import auth

from backend.api import user, patients, consultations, audit, doctor, medical_background
from backend.api.endpoints import portability # Slice 37

# Slice 34 Import
from backend.api.endpoints import diagnosis

# HOTFIX: Database Migration Function
def run_hotfix_migrations():
    """
    Executes raw SQL to ensure new columns exist in the production database.
    This fixes the 'column does not exist' 500 errors.
    """
    try:
        with engine.connect() as conn:
            print("HOTFIX: Running raw SQL migrations...")
            # Patients
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS alergias TEXT;"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedentes_morbidos TEXT;"))
            
            # Clinical Consultations
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS peso_kg FLOAT;"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS estatura_cm FLOAT;"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS imc FLOAT;"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS presion_arterial VARCHAR(20);"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS frecuencia_cardiaca INTEGER;"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS temperatura_c FLOAT;"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS cie10_code VARCHAR(20);"))
            conn.execute(text("ALTER TABLE clinical_consultations ADD COLUMN IF NOT EXISTS cie10_description TEXT;"))
            
            conn.commit()
            print("HOTFIX: Migrations executed successfully.")
    except Exception as e:
        print(f"HOTFIX MIGRATION ERROR: {e}")

if not os.environ.get("PYTEST_CURRENT_TEST") and not os.environ.get("TESTING"):
    Base.metadata.create_all(bind=engine)
    # Execute Hotfix Migrations on Startup
    run_hotfix_migrations()

app = FastAPI(title="Vitalinuage API")

origins = [
    "https://vitalinuage.web.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={"Access-Control-Allow-Origin": "https://vitalinuage.web.app"}
    )

# Centralized Router Registration
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(consultations.router) # Self-contained path
app.include_router(consultations.verification_router) # Self-contained path
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctor"])
app.include_router(medical_background.router, prefix="/api/medical-background", tags=["Medical Background"])
app.include_router(diagnosis.router)
app.include_router(portability.router) # Slice 37

@app.get("/api/health")
async def health_check():
    return {"status": "READY", "db": "connected"}
