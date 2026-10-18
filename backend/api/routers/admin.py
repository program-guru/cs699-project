from fastapi import APIRouter, HTTPException, Response, status

from api.dependencies import CurrentAdmin, DBSession
from core.config import settings
from models.admin import AdminModel
from models.dto import DTO
from service.admin import create_admin, delete_admin, update_admin
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    response.set_cookie(
        key="access_token",
        value=create_access_token(admin.username),
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return DTO(success=True, message="Login successful")


@router.post("/", response_model=DTO[None], status_code=status.HTTP_201_CREATED)
async def create_admin_account(
    database: DBSession,
    admin: AdminModel,
    _: CurrentAdmin,
) -> DTO[None]:
    if not await create_admin(database, admin):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An admin with that username already exists",
        )

    return DTO(success=True, message="Admin created successfully")


@router.put("/{username}", response_model=DTO[None])
async def update_admin_account(
    database: DBSession,
    username: str,
    admin: AdminModel,
    _: CurrentAdmin,
) -> DTO[None]:
    update_result = await update_admin(database, username, admin)
    if update_result == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    if update_result == "duplicate":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An admin with that username already exists",
        )

    return DTO(success=True, message="Admin updated successfully")


@router.delete("/{username}", response_model=DTO[None])
async def delete_admin_account(
    database: DBSession,
    username: str,
    _: CurrentAdmin,
) -> DTO[None]:
    if not await delete_admin(database, username):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )

    return DTO(success=True, message="Admin deleted successfully")