from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserCreate):
    pass

class User(UserBase):
    id: int
    is_verified: bool
    is_onboarded: bool = False
    professional_name: Optional[str] = None
    specialty: Optional[str] = None
    medical_license: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class UserVerify(BaseModel):
    token: str

class UserCreateResponse(BaseModel):
    message: str
    email: EmailStr

class OnboardingUpdate(BaseModel):
    professional_name: Optional[str] = None
    specialty: Optional[str] = None
    medical_license: Optional[str] = None
    registration_number: Optional[str] = None
