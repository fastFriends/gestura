"""FastAPI application entrypoint and lifecycle configuration."""

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, get_users_collection
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, translator

APP_TITLE = "Video Translator API"
APP_DESCRIPTION = "API for authentication and video translation"
APP_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Manage application startup and shutdown tasks.

    Args:
        _app (FastAPI): FastAPI application instance.

    Yields:
        None: Control returns to FastAPI while the app is running.
    """

    await connect_to_mongo()

    users_collection = get_users_collection()
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)
    print("MongoDB indexes created")

    yield

    await close_mongo_connection()


app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(translator.router, prefix="/api", tags=["Translator"])


@app.get("/")
async def root() -> dict[str, str]:
    """Return API metadata for the root endpoint.

    Returns:
        dict[str, str]: Basic information about the API.
    """

    return {
        "message": APP_TITLE,
        "version": APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Return a basic health status response.

    Returns:
        dict[str, str]: Service health status.
    """

    return {"status": "healthy"}
