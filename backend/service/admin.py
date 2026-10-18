from typing import Literal
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from models.admin import AdminModel
from service.auth import password_hash


async def create_admin(database: AsyncDatabase, admin: AdminModel) -> bool:
    document = admin.model_dump(by_alias=True, exclude_none=True)
    document["password"] = password_hash.hash(admin.password)

    try:
        await database["admins"].insert_one(document)
    except DuplicateKeyError:
        return False

    return True


async def update_admin(
    database: AsyncDatabase, username: str, admin: AdminModel
) -> Literal["updated", "not_found", "duplicate"]:
    try:
        result = await database["admins"].update_one(
            {"username": username},
            {
                "$set": {
                    "username": admin.username,
                    "password": password_hash.hash(admin.password),
                }
            },
        )
    except DuplicateKeyError:
        return "duplicate"

    return "updated" if result.matched_count > 0 else "not_found"


async def delete_admin(database: AsyncDatabase, username: str) -> bool:
    result = await database["admins"].delete_one({"username": username})
    return result.deleted_count > 0
