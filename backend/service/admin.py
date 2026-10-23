from typing import Literal

from core.config import settings
from models.admin import Admin, AdminRead, AdminUpdate
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from service.auth import password_hash


async def initialize_database(database: AsyncDatabase) -> None:
    """Create the immutable root admin and enforce unique admin usernames."""
    collection = database["admins"]
    await collection.update_one(
        {"username": settings.ROOT_USERNAME},
        {
            "$setOnInsert": {
                "username": settings.ROOT_USERNAME,
                "password": password_hash.hash(settings.ROOT_PASSWORD),
            }
        },
        upsert=True,
    )


async def create_admin(
    database: AsyncDatabase, admin: Admin
) -> Literal["created", "duplicate", "protected"]:
    if admin.username == settings.ROOT_USERNAME:
        return "protected"

    document = admin.model_dump(by_alias=True, exclude_none=True)
    document["password"] = password_hash.hash(admin.password)

    try:
        await database["admins"].insert_one(document)
    except DuplicateKeyError:
        return "duplicate"

    return "created"


async def list_admins(database: AsyncDatabase) -> list[AdminRead]:
    cursor = (
        database["admins"]
        .find(
            {},
            projection={"password": 0},
        )
        .sort("username", 1)
    )
    return [AdminRead.model_validate(document) async for document in cursor]


async def update_admin(
    database: AsyncDatabase, username: str, admin: AdminUpdate
) -> Literal["updated", "not_found", "duplicate", "protected"]:
    if username == settings.ROOT_USERNAME:
        return "protected"

    update = {"username": admin.username}
    if admin.password:
        update["password"] = password_hash.hash(admin.password)

    try:
        result = await database["admins"].update_one(
            {"username": username},
            {"$set": update},
        )
    except DuplicateKeyError:
        return "duplicate"

    return "updated" if result.matched_count > 0 else "not_found"


async def delete_admin(
    database: AsyncDatabase, username: str
) -> Literal["deleted", "not_found", "protected"]:
    if username == settings.ROOT_USERNAME:
        return "protected"

    result = await database["admins"].delete_one({"username": username})
    return "deleted" if result.deleted_count > 0 else "not_found"
