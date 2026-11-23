import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from models.catalog import College, Department
from models.dto import DTO
from models.misc import ScrapeRequest, Stats
from pydantic import ValidationError
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError
from requests import RequestException
from scrapers.base_scraper import BaseCourseScraper
from scrapers.registry import registry
from service.misc import (
    get_colleges,
    get_course_stats,
    get_departments,
    replace_courses,
)

from api.dependencies import CurrentAdmin, DBSession

router = APIRouter(prefix="/misc", tags=["misc"])
logger = logging.getLogger(__name__)

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

async def _refresh_courses(
    scraper: BaseCourseScraper,
    database: AsyncDatabase,
) -> None:
    try:
        records = await asyncio.to_thread(scraper.scrape)
        await replace_courses(
            database,
            college_name=scraper.college_name,
            department_name=scraper.department_name,
            records=records,
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



@router.post("/scrape", response_model=DTO[None], status_code=status.HTTP_202_ACCEPTED)
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