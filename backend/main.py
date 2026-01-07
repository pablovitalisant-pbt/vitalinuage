from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from backend.db_core import engine, Base
from backend import auth

from backend.api import user
if not os.environ.get("PYTEST_CURRENT_TEST") and not os.environ.get("TESTING"):
    Base.metadata.create_all(bind=engine)
app = FastAPI(title="Vitalinuage API")
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
@app.get("/api/health")
async def health_check():
    return {"status": "READY", "db": "connected"}
