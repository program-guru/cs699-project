from collections.abc import AsyncGenerator
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from core.config import settings

_client: AsyncMongoClient | None = None


def get_client() -> AsyncMongoClient:
    """Return the process-wide MongoDB client, creating it on first use."""
    global _client

    if _client is None:
        if not settings.DATABASE_URI:
            raise RuntimeError(
                "DATABASE_URI must be set before using the MongoDB database."
            )
        _client = AsyncMongoClient(settings.DATABASE_URI)

    return _client


def get_database() -> AsyncDatabase:
    """Return the database named by the configured MongoDB connection string."""
    database = get_client().get_default_database()
    if database is None:
        raise RuntimeError(
            "DATABASE_URI must include a database name, for example "
            "mongodb://localhost:27017/uniscope."
        )

    return database


async def get_database_session() -> AsyncGenerator[AsyncDatabase, None]:
    """FastAPI dependency that provides the configured MongoDB database."""
    yield get_database()


async def close_database_connection() -> None:
    """Close the shared MongoDB client during application shutdown."""
    global _client

    if _client is not None:
        await _client.close()
        _client = None