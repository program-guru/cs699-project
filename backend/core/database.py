from collections.abc import AsyncGenerator

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import CollectionInvalid
from service.admin import create_root_admin
from service.course import ensure_vector_index

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


async def get_database_session() -> AsyncGenerator[AsyncDatabase]:
    """FastAPI dependency that provides the configured MongoDB database."""
    yield get_database()


async def initialize_database() -> None:
    """Create required collections and indexes for a new database."""
    database = get_database()
    existing_collections = set(await database.list_collection_names())

    for collection_name in ("admins", "courses"):
        if collection_name not in existing_collections:
            try:
                await database.create_collection(collection_name)
            except CollectionInvalid:
                # Another startup process may have created it concurrently.
                pass


    await create_root_admin(database)
    await ensure_vector_index(database)


async def close_database_connection() -> None:
    """Close the shared MongoDB client during application shutdown."""
    global _client

    if _client is not None:
        await _client.close()
        _client = None
