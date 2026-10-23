import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from models.dto import DTO
from models.scraper import ScrapeRequest
from pydantic import ValidationError
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError
from requests import RequestException
from scrapers.base_scraper import BaseCourseScraper
from scrapers.registry import registry
from service.scrape import replace_courses

from api.dependencies import CurrentAdmin, DBSession

router = APIRouter(prefix="/scrape", tags=["scrape"])
logger = logging.getLogger(__name__)


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
    try:
        scraper = registry.get(scrapeRequest.college_id, scrapeRequest.department_id)
    except KeyError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown source: {scrapeRequest.college_id}/{scrapeRequest.department_id}",
        ) from error

    background_tasks.add_task(_refresh_courses, scraper, database)

    return DTO(
        success=True,
        message="Course refresh started",
    )
