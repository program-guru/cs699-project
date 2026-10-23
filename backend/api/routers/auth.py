from core.config import settings
from fastapi import APIRouter, HTTPException, Response, status
from models.admin import Admin, AdminRead
from models.dto import DTO
from service.auth import authenticate_admin, create_access_token

from api.dependencies import CurrentAdmin, DBSession

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=DTO[AdminRead])
async def login(
    database: DBSession,
    credentials: Admin,
    response: Response,
) -> DTO[AdminRead]:
    admin = await authenticate_admin(
        database, username=credentials.username, password=credentials.password
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    response.set_cookie(
        key="access_token",
        value=create_access_token(str(admin.id), admin.username),
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return DTO(
        success=True,
        message="Login successful",
        data=AdminRead(_id=admin.id, username=admin.username),
    )


@router.post("/logout", response_model=DTO[None])
async def logout(response: Response) -> DTO[None]:
    response.delete_cookie(key="access_token", path="/")
    return DTO(success=True, message="Logout successful")


@router.get("/me", response_model=DTO[AdminRead])
async def get_current_admin(current_admin: CurrentAdmin) -> DTO[AdminRead]:
    return DTO(
        success=True,
        message="Current admin retrieved successfully",
        data=current_admin,
    )
