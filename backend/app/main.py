from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, translator
from app.database import connect_to_mongo, close_mongo_connection, get_users_collection
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    
    # Create indexes
    users_collection = get_users_collection()
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)
    print("MongoDB indexes created")
    
    yield
    
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()


app = FastAPI(
    title="Video Translator API",
    description="API for authentication and video translation",
    version="1.0.0",
    lifespan=lifespan
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
async def root():
    return {
        "message": "Video Translator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
