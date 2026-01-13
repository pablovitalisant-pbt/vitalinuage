from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from backend.db_core import engine, Base
from backend import auth

from backend.api import user, patients, consultations, audit, doctor, medical_background
if not os.environ.get("PYTEST_CURRENT_TEST") and not os.environ.get("TESTING"):
    Base.metadata.create_all(bind=engine)
app = FastAPI(title="Vitalinuage API")

origins = [
    "http://localhost:5173",      # Local Frontend Dev
    "http://localhost:8080",      # Docker Local
    "https://vitalinuage.web.app", # Production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Router Registration (The Switchboard)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(consultations.router) # Self-contained path: /api/pacientes/{id}/consultas
app.include_router(consultations.verification_router) # Self-contained path: /api/consultas
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctor"])
app.include_router(medical_background.router, prefix="/api/medical-background", tags=["Medical Background"])

# Slice 34: AI Diagnosis
from backend.api.endpoints import diagnosis
app.include_router(diagnosis.router)

@app.get("/api/health")
async def health_check():
    return {"status": "READY", "db": "connected"}
