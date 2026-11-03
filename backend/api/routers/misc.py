from typing import Annotated

from fastapi import APIRouter, Query
from models.dto import DTO
from models.misc import CollegeOption, DepartmentOption, Stats
from service.misc import get_colleges, get_course_stats, get_departments

from api.dependencies import DBSession

router = APIRouter(prefix="/misc", tags=["misc"])


@router.get("/stats", response_model=DTO[Stats])
async def get_statistics(database: DBSession) -> DTO[Stats]:
    return DTO(
        success=True,
        message="Course statistics retrieved successfully",
        data=await get_course_stats(database),
    )


@router.get("/colleges", response_model=DTO[list[CollegeOption]])
async def list_colleges(database: DBSession) -> DTO[list[CollegeOption]]:
    return DTO(
        success=True,
        message="Colleges retrieved successfully",
        data=await get_colleges(database),
    )


@router.get("/departments", response_model=DTO[list[DepartmentOption]])
async def list_departments(
    database: DBSession,
    college_id: Annotated[str | None, Query()] = None,
) -> DTO[list[DepartmentOption]]:
    return DTO(
        success=True,
        message="Departments retrieved successfully",
        data=await get_departments(database, college_id),
    )
