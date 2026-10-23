from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from core.config import settings
from models.admin import Admin
from pwdlib import PasswordHash
from pymongo.asynchronous.database import AsyncDatabase

password_hash = PasswordHash.recommended()


async def authenticate_admin(
    database: AsyncDatabase, username: str, password: str
) -> Admin | None:
    """Return the matching admin when the supplied credentials are valid."""
    document = await database["admins"].find_one({"username": username})
    if document is None:
        return None

    admin = Admin.model_validate(document)
    if not password_hash.verify(password, admin.password):
        return None

    return admin


async def get_admin_by_id(database: AsyncDatabase, admin_id: str) -> Admin | None:
    try:
        object_id = ObjectId(admin_id)
    except InvalidId:
        return None

    document = await database["admins"].find_one({"_id": object_id})
    return Admin.model_validate(document) if document is not None else None


def create_access_token(admin_id: str, username: str) -> str:
    """Create a signed access token for an authenticated admin."""
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY must be configured before creating tokens.")

    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {
        "sub": admin_id,
        "username": username,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
