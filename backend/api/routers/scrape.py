import logging

from fastapi import APIRouter, HTTPException, status
from models.dto import DTO
from pydantic import ValidationError
from pymongo.errors import PyMongoError
from requests import RequestException
from scrapers.registry import registry
from service.scrape import ScrapeResult, replace_courses
from starlette.concurrency import run_in_threadpool

from api.dependencies import CurrentAdmin, DBSession

router = APIRouter(prefix="/scrape", tags=["scrape"])
logger = logging.getLogger(__name__)


@router.post(
    "/{college_id}/{department_id}",
    response_model=DTO[ScrapeResult],
    status_code=status.HTTP_200_OK,
)
async def scrape_courses(
    college_id: str,
    department_id: str,
    database: DBSession,
    _: CurrentAdmin,
) -> DTO[ScrapeResult]:
    try:
        scraper = registry.get(college_id, department_id)
    except KeyError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown source: {college_id}/{department_id}",
        ) from error

    try:
        records = await run_in_threadpool(scraper.scrape)
        result = await replace_courses(
            database,
            college_id=scraper.college_id,
            department_id=scraper.department_id,
            records=records,
        )
    except PyMongoError as error:
        logger.exception(
            "Database failure while refreshing %s/%s",
            scraper.college_id,
            scraper.department_id,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Course data could not be stored. Please try again later.",
        ) from error
    except (
        RequestException,
        RuntimeError,
        TypeError,
        ValueError,
        ValidationError,
    ) as error:
        logger.exception(
            "Scraper failure while refreshing %s/%s",
            scraper.college_id,
            scraper.department_id,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The course source could not be scraped. Please try again later.",
        ) from error
    finally:
        await run_in_threadpool(scraper.close)

    return DTO(
        success=True,
        message="Courses scraped and stored successfully",
        data=result,
    )
