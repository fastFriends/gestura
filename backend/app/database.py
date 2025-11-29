from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from .config import settings

# MongoDB client instance
mongodb_client: Optional[AsyncIOMotorClient] = None


async def connect_to_mongo():
    """Create database connection"""
    global mongodb_client
    mongodb_client = AsyncIOMotorClient(settings.MONGODB_URI)
    print("Connected to MongoDB")


async def close_mongo_connection():
    """Close database connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("Closed MongoDB connection")


def get_database():
    """Get database instance"""
    return mongodb_client.gestura


def get_users_collection():
    """Get users collection"""
    db = get_database()
    return db.users
