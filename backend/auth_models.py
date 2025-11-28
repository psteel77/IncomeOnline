from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class User(BaseModel):
    email: EmailStr
    verified: bool = False
    verification_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class LoginRequest(BaseModel):
    email: EmailStr

class VerifyRequest(BaseModel):
    token: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None

class UserResponse(BaseModel):
    email: str
    verified: bool
    created_at: datetime
