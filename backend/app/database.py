"""MongoDB connection utilities for the application."""

from typing import Optional

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)

from .config import settings

# MongoDB client instance
mongodb_client: Optional[AsyncIOMotorClient] = None
DATABASE_NAME = "gestura"
USERS_COLLECTION_NAME = "users"


async def connect_to_mongo() -> None:
    """Create a MongoDB client connection."""

    global mongodb_client
    mongodb_client = AsyncIOMotorClient(settings.MONGODB_URI)
    print("Connected to MongoDB")


async def close_mongo_connection() -> None:
    """Close the MongoDB client connection if it exists."""

    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        mongodb_client = None
        print("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get the configured MongoDB database instance.

    Returns:
        AsyncIOMotorDatabase: Active database handle.

    Raises:
        RuntimeError: If the MongoDB client has not been initialized.
    """

    if mongodb_client is None:
        raise RuntimeError("MongoDB client is not initialized")

    return mongodb_client[DATABASE_NAME]


def get_users_collection() -> AsyncIOMotorCollection:
    """Get the users collection handle.

    Returns:
        AsyncIOMotorCollection: MongoDB users collection.
    """

    db = get_database()
    return db[USERS_COLLECTION_NAME]
