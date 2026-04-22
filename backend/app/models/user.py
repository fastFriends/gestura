"""Domain model definitions for users."""

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, field_validator


class User(BaseModel):
    """Application user model stored in MongoDB.

    Attributes:
        id (Optional[str]): MongoDB document identifier.
        email (EmailStr): User email address.
        username (str): Public username.
        hashed_password (str): Password hash.
        is_active (bool): Active user status flag.
        created_at (datetime): Creation timestamp.
        updated_at (Optional[datetime]): Last update timestamp.
    """

    id: Optional[str] = Field(alias="_id", default=None)
    email: EmailStr
    username: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    @field_validator("id", mode="before")
    @classmethod
    def validate_object_id(cls, v: Any) -> Optional[str]:
        """Normalize MongoDB ObjectId values into string IDs.

        Args:
            v (Any): Incoming identifier value.

        Returns:
            Optional[str]: Normalized ID value.

        Raises:
            ValueError: If value cannot be represented as an ID string.
        """

        if v is None:
            return None
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        raise ValueError("Invalid ObjectId")

    class Config:
        """Pydantic model configuration for serialization compatibility."""

        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
