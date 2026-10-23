from typing import Any

from pydantic import TypeAdapter
from pymongo.asynchronous.database import AsyncDatabase

from models.course import Course
from models.scraper import ScrapeResult

COURSE_ADAPTER = TypeAdapter(list[Course])


async def replace_courses(
    database: AsyncDatabase,
    *,
    college_id: str,
    department_id: str,
    records: list[dict[str, Any]],
) -> ScrapeResult:
    courses = COURSE_ADAPTER.validate_python(records)
    documents = [course.model_dump(mode="json") for course in courses]
    source_filter = {
        "college_id": college_id,
        "department_id": department_id,
    }

    async with (
        database.client.start_session() as session,
        session.start_transaction(),
    ):
        await database["courses"].delete_many(source_filter, session=session)
        if documents:
            await database["courses"].insert_many(documents, session=session)

    return ScrapeResult(
        college_id=college_id,
        department_id=department_id,
        count=len(documents),
    )
