from fastapi import APIRouter, HTTPException, status

from api.dependencies import CurrentAdmin, DBSession
from models.admin import Admin, AdminRead, AdminUpdate
from models.dto import DTO
from service.admin import create_admin, delete_admin, list_admins, update_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/", response_model=DTO[list[AdminRead]])
async def get_admins(
    database: DBSession,
    _: CurrentAdmin,
) -> DTO[list[AdminRead]]:
    return DTO(
        success=True,
        message="Admins retrieved successfully",
        data=await list_admins(database),
    )


@router.post("/", response_model=DTO[None], status_code=status.HTTP_201_CREATED)
async def create_admin_account(
    database: DBSession,
    admin: Admin,
    _: CurrentAdmin,
) -> DTO[None]:
    create_result = await create_admin(database, admin)
    if create_result == "protected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The root admin cannot be created",
        )
    if create_result == "duplicate":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An admin with that username already exists",
        )

    return DTO(success=True, message="Admin created successfully")


@router.put("/{username}", response_model=DTO[None])
async def update_admin_account(
    database: DBSession,
    username: str,
    admin: AdminUpdate,
    _: CurrentAdmin,
) -> DTO[None]:
    update_result = await update_admin(database, username, admin)
    if update_result == "protected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The root admin cannot be updated",
        )
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
    delete_result = await delete_admin(database, username)
    if delete_result == "protected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The root admin cannot be deleted",
        )
    if delete_result == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )

    return DTO(success=True, message="Admin deleted successfully")
