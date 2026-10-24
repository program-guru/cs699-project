from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from models.course import Course, CoursePage, CourseRead
from models.dto import DTO
from service.course import (
    create_course,
    delete_course,
    get_course,
    list_courses,
    update_course,
)

from api.dependencies import CurrentAdmin, DBSession

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=DTO[CoursePage])
async def get_courses(
    database: DBSession,
    college_id: Annotated[str | None, Query()] = None,
    department_id: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> DTO[CoursePage]:
    return DTO(
        success=True,
        message="Courses retrieved successfully",
        data=await list_courses(
            database,
            college_id,
            department_id,
            page,
            page_size,
        ),
    )


@router.get("/{course_id}", response_model=DTO[CourseRead])
async def get_course_by_id(
    course_id: str,
    database: DBSession,
) -> DTO[CourseRead]:
    course = await get_course(database, course_id)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return DTO(success=True, message="Course retrieved successfully", data=course)


@router.post("/", response_model=DTO[CourseRead], status_code=status.HTTP_201_CREATED)
async def create_course_record(
    course: Course,
    database: DBSession,
    _: CurrentAdmin,
) -> DTO[CourseRead]:
    return DTO(
        success=True,
        message="Course created successfully",
        data=await create_course(database, course),
    )


@router.put("/{course_id}", response_model=DTO[None])
async def update_course_record(
    course_id: str,
    course: Course,
    database: DBSession,
    _: CurrentAdmin,
) -> DTO[None]:
    result = await update_course(database, course_id, course)
    if result == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return DTO(success=True, message="Course updated successfully")


@router.delete("/{course_id}", response_model=DTO[None])
async def delete_course_record(
    course_id: str,
    database: DBSession,
    _: CurrentAdmin,
) -> DTO[None]:
    result = await delete_course(database, course_id)
    if result == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return DTO(success=True, message="Course deleted successfully")
