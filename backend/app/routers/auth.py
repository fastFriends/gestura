"""Authentication API routes."""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.config import settings
from app.database import get_users_collection
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.utils.auth import (
    create_access_token,
    get_password_hash,
    get_current_active_user,
    verify_password,
)

router = APIRouter()


async def _find_existing_user(user: UserCreate) -> dict[str, Any] | None:
    """Find an existing user by email or username.

    Args:
        user (UserCreate): Signup payload.

    Returns:
        dict[str, Any] | None: Existing user document, if any.
    """

    users_collection = get_users_collection()
    return await users_collection.find_one(
        {
            "$or": [
                {"email": user.email},
                {"username": user.username},
            ]
        }
    )


def _raise_duplicate_user_error(existing_user: dict[str, Any], user: UserCreate) -> None:
    """Raise a consistent error for duplicate users.

    Args:
        existing_user (dict[str, Any]): Matching user document.
        user (UserCreate): Incoming signup data.

    Raises:
        HTTPException: Always raised with duplicate user details.
    """

    if existing_user.get("email") == user.email:
        detail = "Email already registered"
    else:
        detail = "Username already taken"

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate) -> User:
    """Register a new user account.

    Args:
        user (UserCreate): Signup payload.

    Returns:
        User: Created user record.

    Raises:
        HTTPException: If email or username already exists.
    """

    users_collection = get_users_collection()

    existing_user = await _find_existing_user(user)
    if existing_user:
        _raise_duplicate_user_error(existing_user, user)

    hashed_password = get_password_hash(user.password)
    new_user_data: dict[str, Any] = {
        "email": user.email,
        "username": user.username,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }

    result = await users_collection.insert_one(new_user_data)
    new_user_data["_id"] = result.inserted_id

    return User(**new_user_data)


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    response: Response,
) -> Token:
    """Authenticate a user and return an access token.

    Args:
        user_credentials (UserLogin): Login payload.
        response (Response): FastAPI response used to set cookies.

    Returns:
        Token: Access token response.

    Raises:
        HTTPException: If credentials are invalid or account is inactive.
    """

    users_collection = get_users_collection()

    user_data = await users_collection.find_one({"email": user_credentials.email})

    if not user_data or not verify_password(
        user_credentials.password,
        user_data["hashed_password"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_data.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data["email"]},
        expires_delta=access_token_expires,
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    """Logout current user by clearing auth cookie.

    Args:
        response (Response): FastAPI response object.

    Returns:
        dict[str, str]: Logout confirmation message.
    """

    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)) -> User:
    """Return the currently authenticated user profile.

    Args:
        current_user (User): Current active user dependency.

    Returns:
        User: Current authenticated user.
    """

    return current_user
