"""Application configuration values loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime settings for the backend service.

    Attributes:
        MONGODB_URI (str): MongoDB connection string.
        SECRET_KEY (str): Secret used to sign JWT tokens.
        ALGORITHM (str): JWT signing algorithm.
        ACCESS_TOKEN_EXPIRE_MINUTES (int): Access-token lifetime in minutes.
        FRONTEND_URL (str): Frontend URL allowed for CORS.
    """

    MONGODB_URI: str = "mongodb://localhost:27017"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
