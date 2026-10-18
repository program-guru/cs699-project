from fastapi import APIRouter, HTTPException, Response, status

from api.dependencies import DBSession
from core.config import settings
from models.admin import AdminModel
from models.dto import DTO
from service.auth import authenticate_admin, create_access_token

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=DTO[None])
async def login(
    database: DBSession,
    credentials: AdminModel,
    response: Response,
) -> DTO[None]:
    
    admin = await authenticate_admin(
        database, username=credentials.username, password=credentials.password
    )
    
    if admin is None:
        return DTO(success=False, message="Invalid username or password")

    response.set_cookie(
        key="access_token",
        value=create_access_token(admin.username),
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return DTO(success=True, message="Login successful")