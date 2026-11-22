from typing import Annotated

from fastapi import APIRouter, Query
from models.catalog import College, Department
from models.dto import DTO
from models.misc import Stats
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


@router.get("/colleges", response_model=DTO[list[College]])
async def list_colleges() -> DTO[list[College]]:
    return DTO(
        success=True,
        message="Colleges retrieved successfully",
        data=get_colleges(),
    )


@router.get("/departments", response_model=DTO[list[Department]])
async def list_departments(
    college_name: Annotated[College | None, Query()] = None,
) -> DTO[list[Department]]:
    return DTO(
        success=True,
        message="Departments retrieved successfully",
        data=get_departments(college_name),
    )
