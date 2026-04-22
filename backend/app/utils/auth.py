"""Authentication helpers for password hashing and JWT validation."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_users_collection
from app.models.user import User
from app.schemas.user import TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token
security = HTTPBearer()


def _decode_password_bytes(password: bytes) -> str:
    """Decode UTF-8 password bytes.

    Args:
        password (bytes): Password bytes provided by caller.

    Returns:
        str: Decoded password string.

    Raises:
        HTTPException: If bytes are not valid UTF-8.
    """

    try:
        return password.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password bytes are not valid UTF-8",
        ) from exc


def verify_password(plain_password: Union[str, bytes], hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed password.

    Args:
        plain_password (Union[str, bytes]): Plaintext password.
        hashed_password (str): Stored hash.

    Returns:
        bool: True if password matches; otherwise False.
    """

    if isinstance(plain_password, bytes):
        plain_password = _decode_password_bytes(plain_password)

    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: Union[str, bytes]) -> str:
    """Hash a password after validating format and length.

    Args:
        password (Union[str, bytes]): Password text or UTF-8 bytes.

    Returns:
        str: Bcrypt password hash.

    Raises:
        HTTPException: If UTF-8 decoding fails or bcrypt byte limit is exceeded.
    """

    if isinstance(password, bytes):
        pw_bytes = password
        password = _decode_password_bytes(pw_bytes)
    else:
        pw_bytes = password.encode("utf-8")

    if len(pw_bytes) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password too long for bcrypt (max 72 bytes). "
                "Use a shorter password or switch to a different hashing scheme."
            ),
        )

    return pwd_context.hash(password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token.

    Args:
        data (dict[str, Any]): Claims to include in the token.
        expires_delta (Optional[timedelta]): Explicit token lifetime override.

    Returns:
        str: Encoded JWT token.
    """

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> TokenData:
    """Decode and validate a JWT access token.

    Args:
        token (str): Encoded JWT token.

    Returns:
        TokenData: Parsed token subject information.

    Raises:
        HTTPException: If the token is invalid or missing required claims.
    """

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        return TokenData(email=email)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Return the currently authenticated user.

    Args:
        credentials (HTTPAuthorizationCredentials): Bearer auth credentials.

    Returns:
        User: Authenticated user model.

    Raises:
        HTTPException: If the user cannot be found or is inactive.
    """

    token = credentials.credentials
    token_data = decode_access_token(token)

    users_collection = get_users_collection()
    user_data = await users_collection.find_one({"email": token_data.email})

    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    user = User(**user_data)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the current user after active-status validation.

    Args:
        current_user (User): Authenticated current user.

    Returns:
        User: Active current user.
    """

    return current_user
