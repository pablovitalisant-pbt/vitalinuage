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

@app.get("/")
def read_root():
    return {"status": "Vitalinuage Online v1.0"}

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

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

# TEMPORARY: Emergency password reset - GET endpoint for browser access
@app.get("/admin/reset-password")
def reset_password_emergency(db: Session = Depends(get_db)):
    """
    Emergency password reset endpoint.
    Visit this URL to reset password for pablovitalisant@gmail.com
    """
    email = "pablovitalisant@gmail.com"
    new_password = "Vitali2026!"
    
    user = crud.get_user_by_email(db, email=email)
    if not user:
        return {"status": "ERROR", "message": f"User {email} not found in database"}
    
    # Use the SAME hashing function as registration
    new_hashed_password = auth.get_password_hash(new_password)
    user.hashed_password = new_hashed_password
    db.commit()
    
    print(f"[RESET] Password reset successful for {email}")
    print(f"[RESET] New hash: {new_hashed_password[:30]}...")
    
    return {
        "status": "SUCCESS",
        "message": f"Password reset successfully for {email}",
        "new_password": new_password,
        "instructions": "You can now login with this password at https://vitalinuage.web.app"
    }
