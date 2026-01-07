from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from core.config import settings
    import migrate_bcrypt
    import temp_reset
except ImportError:
    from .core.config import settings
    from . import migrate_bcrypt
    from . import temp_reset

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(migrate_bcrypt.router, tags=["Admin"])
app.include_router(temp_reset.router, tags=["Admin"])

@app.get("/api/health")
def health_check():
    return {"status": "READY", "version": settings.VERSION}
