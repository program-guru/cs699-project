from typing import Any

from models.course import Course
from models.scraper import ScrapeResult
from pydantic import TypeAdapter
from pymongo.asynchronous.client_session import AsyncClientSession
from pymongo.asynchronous.database import AsyncDatabase

COURSE_ADAPTER = TypeAdapter(list[Course])


async def _supports_transactions(database: AsyncDatabase) -> bool:
    hello = await database.client.admin.command("hello")
    return bool(hello.get("setName") or hello.get("msg") == "isdbgrid")


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

    async def replace_in_transaction(session: AsyncClientSession | None) -> None:
        await database["courses"].delete_many(source_filter, session=session)
        if documents:
            await database["courses"].insert_many(documents, session=session)

    if await _supports_transactions(database):
        async with database.client.start_session() as session:
            await session.with_transaction(replace_in_transaction)
    else:
        await replace_in_transaction(None) 

    return ScrapeResult(
        college_id=college_id,
        department_id=department_id,
        count=len(documents),
    )
