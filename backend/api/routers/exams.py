import asyncio
import logging
from typing import Annotated

from exam_scrapers.base_scraper import BaseExamScraper
from exam_scrapers.registry import exam_registry
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from models.catalog import Exam
from models.dto import DTO
from models.exam import ExamTimeline
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError
from requests import RequestException
from service.exam import get_exam_timeline, replace_exam_timeline

from api.dependencies import CurrentAdmin, DBSession

router = APIRouter(prefix="/exams", tags=["exams"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=DTO[list[str]])
async def list_exams() -> DTO[list[str]]:
    return DTO(
        success=True,
        message="Exams retrieved successfully",
        data=[exam.value for exam in exam_registry.exams()],
    )


async def _refresh_exam_timeline(
    scraper: BaseExamScraper,
    database: AsyncDatabase,
) -> None:
    try:
        records = await asyncio.to_thread(scraper.scrape)
        await replace_exam_timeline(
            database,
            exam=scraper.exam_name,
            year=scraper.year,
            source_url=scraper.source_url,
            records=records,
        )
    except (PyMongoError, RequestException, RuntimeError, TypeError, ValueError):
        logger.exception(
            "Exam timeline refresh failed for %s %s",
            scraper.exam_name.value,
            scraper.year,
        )
    finally:
        scraper.close()


@router.get("/{exam_name}", response_model=DTO[ExamTimeline])
async def get_exam(
    exam_name: str,
    database: DBSession,
    year: Annotated[int | None, Query()] = None,
) -> DTO[ExamTimeline]:
    try:
        normalized = Exam(exam_name.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown exam",
        ) from None

    available_years = exam_registry.years(normalized)
    selected_year = year or (available_years[0] if available_years else None)

    if selected_year is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown exam",
        )

    try:
        exam_registry.get(normalized, selected_year)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown exam or year",
        ) from None

    timeline = await get_exam_timeline(database, normalized, selected_year)
    if timeline is None:
        try:
            scraper = exam_registry.get(normalized, selected_year)
            records = await asyncio.to_thread(scraper.scrape)
            await replace_exam_timeline(
                database,
                exam=scraper.exam_name,
                year=scraper.year,
                source_url=scraper.source_url,
                records=records,
            )
            timeline = await get_exam_timeline(
                database,
                normalized,
                selected_year,
            )
        except (KeyError, RequestException, RuntimeError, TypeError, ValueError, PyMongoError):
            logger.exception(
                "Initial exam timeline scrape failed for %s %s",
                normalized.value,
                selected_year,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to load the exam timeline",
            ) from None
        finally:
            if "scraper" in locals():
                scraper.close()

    if timeline is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam timeline contains no records",
        )

    return DTO(
        success=True,
        message="Exam timeline retrieved successfully",
        data=timeline,
    )


@router.post(
    "/{exam_name}/refresh",
    response_model=DTO[None],
    status_code=status.HTTP_202_ACCEPTED,
)
async def refresh_exam(
    exam_name: str,
    database: DBSession,
    background_tasks: BackgroundTasks,
    _: CurrentAdmin,
    year: Annotated[int | None, Query()] = None,
) -> DTO[None]:
    try:
        normalized = Exam(exam_name.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown exam",
        ) from None

    available_years = exam_registry.years(normalized)
    selected_year = year or (available_years[0] if available_years else None)
    if selected_year is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown exam",
        )

    try:
        scraper = exam_registry.get(normalized, selected_year)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown exam or year",
        ) from None

    background_tasks.add_task(_refresh_exam_timeline, scraper, database)
    return DTO(
        success=True,
        message=f"{normalized.value} {selected_year} timeline refresh started",
    )
