from fastapi import FastAPI, Depends, HTTPException, status
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

from api import patients
app.include_router(patients.router)

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
VERSION = "1.1.1-fixed-logic"

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

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"[REGISTER] Starting registration for: {user.email}")
        
        db_user = crud.get_user_by_email(db, email=user.email)
        if db_user:
            print(f"[REGISTER] User already exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        print(f"[REGISTER] User not found, proceeding with creation")
        new_user = crud.create_user(db=db, user=user)
        
        print(f"[REGISTER] User created successfully: {new_user.email} (ID: {new_user.id})")
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[REGISTER] ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[REGISTER] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

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

# PRODUCTION: Migrate user to bcrypt standard
@app.get("/admin/migrate-to-bcrypt")
def migrate_to_bcrypt(db: Session = Depends(get_db)):
    """
    Migrate existing user from pbkdf2 to bcrypt.
    Visit this URL to update password hash to bcrypt standard.
    """
    email = "pablovitalisant@gmail.com"
    new_password = "Vitali2026!"
    
    user = crud.get_user_by_email(db, email=email)
    if not user:
        return {"status": "ERROR", "message": f"User {email} not found"}
    
    # Generate NEW bcrypt hash (auth.py now uses bcrypt)
    new_hash = auth.get_password_hash(new_password)
    user.hashed_password = new_hash
    db.commit()
    
    print(f"[MIGRATION] User {email} migrated to bcrypt")
    print(f"[MIGRATION] New bcrypt hash: {new_hash[:30]}...")
    
    return {
        "status": "SUCCESS",
        "message": f"User {email} migrated to bcrypt successfully",
        "algorithm": "bcrypt",
        "password": new_password,
        "instructions": "You can now login at https://vitalinuage.web.app"
    }
