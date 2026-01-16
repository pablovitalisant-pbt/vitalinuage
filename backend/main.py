from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import text
from backend.db_core import engine, Base
from backend import auth

from backend.api import user, patients, consultations, audit, doctor, medical_background
from backend.api.endpoints import portability
from backend.api.endpoints import user_deletion
from backend.api.endpoints import diagnosis

# -------------------------------------------------------------------
# HOTFIX: Database Migration Function
# -------------------------------------------------------------------
def run_hotfix_migrations():
    try:
        with engine.connect() as conn:
            print("HOTFIX: Running raw SQL migrations...")

            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS alergias TEXT;"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedentes_morbidos TEXT;"))

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
    run_hotfix_migrations()

# -------------------------------------------------------------------
# FastAPI App
# -------------------------------------------------------------------
app = FastAPI(title="Vitalinuage API")

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------
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

# -------------------------------------------------------------------
# Global Exception Handler
# -------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

# -------------------------------------------------------------------
# API Routers
# -------------------------------------------------------------------
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(consultations.router)
app.include_router(consultations.verification_router)
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(doctor.router, prefix="/api/doctors", tags=["Doctor"])
app.include_router(medical_background.router, prefix="/api/medical-background", tags=["Medical Background"])
app.include_router(diagnosis.router)
app.include_router(portability.router)
app.include_router(user_deletion.router, tags=["Security"])

@app.get("/api/health")
async def health_check():
    return {"status": "READY", "db": "connected"}

# -------------------------------------------------------------------
# Frontend (Vite) – Static Files + SPA fallback
# -------------------------------------------------------------------
FRONTEND_DIST = "/app/frontend/dist"

if os.path.isdir(FRONTEND_DIST):
    print("Frontend detected. Serving static files.")

    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"detail": "Frontend not built"})
else:
    print("WARNING: frontend/dist not found. API only mode.")
