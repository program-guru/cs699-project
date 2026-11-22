from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from models.compare import ComparisonSummary
from models.course import SimilarCourse
from models.dto import DTO
from service.comparison import get_comparison_summary
from service.course import find_similar_courses
from service.llm import LLMError

from api.dependencies import DBSession

router = APIRouter(prefix="/compare", tags=["compare"])


@router.get("/{course_id}", response_model=DTO[list[SimilarCourse]])
async def get_similar_courses(
    course_id: str,
    database: DBSession,
    limit: Annotated[int, Query(ge=1, le=25)] = 10,
    cross_department: Annotated[bool, Query()] = False,
) -> DTO[list[SimilarCourse]]:
    result = await find_similar_courses(database, course_id, limit, cross_department)
    if result == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    if result == "no_embedding":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course has no embedding yet; run the backfill or re-scrape",
        )
    return DTO(
        success=True,
        message="Similar courses retrieved successfully",
        data=result,
    )


@router.get(
    "/{primary_course_id}/{secondary_course_id}",
    response_model=DTO[ComparisonSummary],
)
async def get_ai_summary(
    primary_course_id: str,
    secondary_course_id: str,
    database: DBSession,
) -> DTO[ComparisonSummary]:
    if primary_course_id == secondary_course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose two different courses to compare",
        )

    try:
        result = await get_comparison_summary(
            database,
            primary_course_id,
            secondary_course_id,
        )
    except LLMError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI summary is temporarily unavailable. Please try again shortly.",
        ) from None

    if result == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return DTO(
        success=True,
        message="AI summary retrieved successfully",
        data=result,
    )
