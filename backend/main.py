from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os

import models
import schemas
import crud
import auth
from database import SessionLocal, engine, get_db
# Create Tables
# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vitalinuage API")

# Global exception handlers to ensure JSON responses
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

from api import patients, doctor, medical_background, consultations, maps
from api import print as print_api
from api import verification, audit, user
from api.consultations import verification_router
app.include_router(patients.router)
app.include_router(doctor.router)
app.include_router(user.router)
app.include_router(medical_background.router)
app.include_router(consultations.router)
app.include_router(maps.router)
app.include_router(print_api.router)
app.include_router(verification.router)
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(verification_router)

# CORS Configuration for Production and Development
origins = [
    # Development
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    # Production Firebase Hosting
    "https://vitalinuage.web.app",
    "https://vitalinuage.firebaseapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Dependency


from dependencies import get_current_user
from datetime import datetime

# Build timestamp for version tracking
BUILD_TIME = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
VERSION = "1.1.2-atomic-fix"

@app.get("/")
def read_root():
    return {
        "status": "Vitalinuage Online",
        "version": VERSION,
        "build_time": BUILD_TIME,
        "features": ["SHA-256 pre-hashing", "bcrypt", "JWT auth"]
    }

@app.get("/version")
def get_version():
    return {
        "version": VERSION,
        "build_time": BUILD_TIME,
        "auth_method": "SHA-256 + bcrypt",
        "timestamp": datetime.utcnow().isoformat()
    }

from datetime import datetime
import uuid
from datetime import timedelta
from services.email_service import EmailService

# ... imports ...


@app.post("/register", response_model=schemas.UserCreateResponse, status_code=201)
def register(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        print(f"[REGISTER] Starting registration for: {user.email}")
        
        db_user = crud.get_user_by_email(db, email=user.email)
        if db_user:
            print(f"[REGISTER] User already exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        print(f"[REGISTER] User not found, proceeding with creation")
        
        # New: verification logic
        verification_token = str(uuid.uuid4())
        # Use datetime.now() instead of utcnow() due to deprecation warning in tests
        expires_at = datetime.now() + timedelta(hours=24)
        
        # Create user via CRUD (Assuming CRUD handles extra fields or we manually update)
        # We need to manually update the user object before adding to DB in CRUD, 
        # BUT crud.create_user takes schemas.UserCreate which doesn't have these fields.
        # So we should modify crud.create_user OR do it here manually.
        # Let's Modify crud.create_user call slightly or update object after.
        
        hashed_password = auth.get_password_hash(user.password)
        db_user = models.User(
            email=user.email,
            hashed_password=hashed_password,
            is_verified=False,
            verification_token=verification_token,
            verification_token_expires_at=expires_at
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Send Email in Background
        background_tasks.add_task(EmailService.send_verification_email, user.email, verification_token)
        
        print(f"[REGISTER] User created successfully: {db_user.email} (ID: {db_user.id})")
        return {"message": "User created. Please check your email to verify account.", "email": user.email}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[REGISTER] ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[REGISTER] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/verify", response_model=schemas.Token)
def verify_email(verification_data: schemas.UserVerify, db: Session = Depends(get_db)):
    token = verification_data.token
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
        
    if user.verification_token_expires_at and user.verification_token_expires_at < datetime.now():
        raise HTTPException(status_code=400, detail="Verification token expired")
        
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"[LOGIN] Attempting login for: {user_credentials.email}")
        user = crud.get_user_by_email(db, email=user_credentials.email)
        if not user:
            print(f"[LOGIN] User not found: {user_credentials.email}")
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        print(f"[LOGIN] User found: {user.email}")
        password_match = auth.verify_password(user_credentials.password, user.hashed_password)
        print(f"[LOGIN] Password match: {password_match}")
        
        if not password_match:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        # Check Verification
        if not user.is_verified:
             print(f"[LOGIN] User not verified: {user.email}")
             raise HTTPException(
                 status_code=403, 
                 detail="EMAIL_NOT_VERIFIED"
             )
        
        access_token = auth.create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LOGIN] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


