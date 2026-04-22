"""Pydantic schemas used by authentication endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Shared user fields for request and response schemas."""

    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for user signup requests."""

    password: str


class UserLogin(BaseModel):
    """Schema for login requests."""

    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user details returned by API endpoints."""

    id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class Token(BaseModel):
    """Schema for JWT token responses."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema representing token subject data."""

    email: Optional[str] = None
