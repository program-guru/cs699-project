import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import ValidationError
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError
from requests import RequestException

from api.dependencies import CurrentAdmin, DBSession
from models.dto import DTO
from models.scraper import DeleteCoursesRequest, ScrapeRequest, ScrapeSource
from scrapers.base_scraper import BaseCourseScraper
from scrapers.registry import registry
from service.course import delete_courses_by_source
from service.scrape import replace_courses

router = APIRouter(prefix="/scrape", tags=["scrape"])
logger = logging.getLogger(__name__)


@router.get("/sources", response_model=DTO[list[ScrapeSource]])
async def get_scrape_sources(_: CurrentAdmin) -> DTO[list[ScrapeSource]]:
    sources = [ScrapeSource(**source) for source in registry.available_sources()]
    return DTO(
        success=True,
        message="Available scrape sources",
        data=sources,
    )


async def _refresh_courses(
    scraper: BaseCourseScraper,
    database: AsyncDatabase,
) -> None:
    try:
        records = scraper.scrape()
        result = await replace_courses(
            database,
            college_id=scraper.college_id,
            department_id=scraper.department_id,
            records=records,
        )
        logger.info(
            "Refreshed %s/%s with %d courses",
            result.college_id,
            result.department_id,
            result.count,
        )
    except PyMongoError:
        logger.exception(
            "Database failure while refreshing %s/%s",
            scraper.college_id,
            scraper.department_id,
        )
    except (
        RequestException,
        RuntimeError,
        TypeError,
        ValueError,
        ValidationError,
    ):
        logger.exception(
            "Scraper failure while refreshing %s/%s",
            scraper.college_id,
            scraper.department_id,
        )
    finally:
        scraper.close()


@router.post("/", response_model=DTO[None], status_code=status.HTTP_202_ACCEPTED)
async def scrape_courses(
    scrapeRequest: ScrapeRequest,
    database: DBSession,
    background_tasks: BackgroundTasks,
    _: CurrentAdmin,
) -> DTO[None]:
    sources = [
        source
        for source in registry.available_sources()
        if (
            scrapeRequest.college_id is None
            or source["college_id"] == scrapeRequest.college_id.lower()
        )
        and (
            scrapeRequest.department_id is None
            or source["department_id"] == scrapeRequest.department_id.lower()
        )
    ]
    if not sources:
        source_name = "/".join(
            part
            for part in (
                scrapeRequest.college_id,
                scrapeRequest.department_id,
            )
            if part is not None
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown source: {source_name}",
        )

    for source in sources:
        scraper = registry.get(source["college_id"], source["department_id"])
        background_tasks.add_task(_refresh_courses, scraper, database)

    return DTO(
        success=True,
        message=f"Course refresh started for {len(sources)} source(s)",
    )


@router.delete("/courses", response_model=DTO[int])
async def delete_scraped_courses(
    request: DeleteCoursesRequest,
    database: DBSession,
    _: CurrentAdmin,
) -> DTO[int]:
    sources = registry.available_sources()
    matching_sources = [
        source
        for source in sources
        if source["college_id"] == request.college_id.lower()
        and (
            request.department_id is None
            or source["department_id"] == request.department_id.lower()
        )
    ]
    if not matching_sources:
        source_name = "/".join(
            part
            for part in (request.college_id, request.department_id)
            if part is not None
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown source: {source_name}",
        )

    deleted_count = await delete_courses_by_source(
        database,
        college_id=request.college_id.lower(),
        department_id=(
            request.department_id.lower() if request.department_id is not None else None
        ),
    )
    return DTO(
        success=True,
        message=f"Deleted {deleted_count} course(s)",
        data=deleted_count,
    )
