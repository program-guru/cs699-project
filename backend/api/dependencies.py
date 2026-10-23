from typing import Annotated

import jwt
from core.config import settings
from core.database import get_database_session
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie
from models.admin import Admin
from pymongo.asynchronous.database import AsyncDatabase
from service.auth import get_admin_by_id

DBSession = Annotated[AsyncDatabase, Depends(get_database_session)]
access_token_cookie = APIKeyCookie(name="access_token", auto_error=False)


async def get_current_admin(
    database: DBSession,
    access_token: Annotated[str | None, Depends(access_token_cookie)],
) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication cookie",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not access_token or not settings.SECRET_KEY:
        raise credentials_exception

    try:
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        admin_id = payload.get("sub")
        if not isinstance(admin_id, str) or not admin_id:
            raise credentials_exception
    except jwt.InvalidTokenError as error:
        raise credentials_exception from error

    admin = await get_admin_by_id(database, admin_id)
    if admin is None:
        raise credentials_exception

    return admin


CurrentAdmin = Annotated[Admin, Depends(get_current_admin)]
