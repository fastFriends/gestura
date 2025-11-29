from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId


class User(BaseModel):
    """MongoDB User model"""
    id: Optional[str] = Field(alias="_id", default=None)
    email: EmailStr
    username: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def validate_object_id(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        raise ValueError("Invalid ObjectId")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
