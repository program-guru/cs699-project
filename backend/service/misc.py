import asyncio

from models.catalog import College, Department
from models.misc import Stats
from pymongo.asynchronous.database import AsyncDatabase
from scrapers.registry import registry


async def get_course_stats(database: AsyncDatabase) -> Stats:
    collection = database["courses"]
    colleges, courses = await asyncio.gather(
        collection.distinct("college_name"),
        collection.count_documents({}),
    )
    return Stats(universities=len(colleges), courses=courses)


def get_colleges() -> list[College]:
    return registry.colleges()


def get_departments(college: College | None = None) -> list[Department]:
    return registry.departments(college)
