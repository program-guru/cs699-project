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
            college_name=scraper.college_name,
            department_name=scraper.department_name,
            records=records,
        )
        logger.info(
            "Refreshed %s/%s with %d courses",
            result.college_name,
            result.department_name,
            result.count,
        )
    except PyMongoError:
        logger.exception(
            "Database failure while refreshing %s/%s",
            scraper.college_name,
            scraper.department_name,
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
            scraper.college_name,
            scraper.department_name,
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
        scraper = registry.get(
            scrapeRequest.college_name,
            scrapeRequest.department_name,
        )
        background_tasks.add_task(_refresh_courses, scraper, database)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown source",
        ) from None

    return DTO(
        success=True,
        message="Course refresh started",
    )