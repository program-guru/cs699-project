import asyncio

from core.config import settings
from models.catalog import College, Department
from models.course import Course
from models.misc import Stats
from pymongo.asynchronous.client_session import AsyncClientSession
from pymongo.asynchronous.database import AsyncDatabase
from scrapers.registry import registry

from service.embedding import embed_texts, embedding_text


async def _supports_transactions(database: AsyncDatabase) -> bool:
    hello = await database.client.admin.command("hello")
    return bool(hello.get("setName") or hello.get("msg") == "isdbgrid")

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


async def replace_courses(
    database: AsyncDatabase,
    college_name: College,
    department_name: Department,
    records: list[Course],
) :
    documents = [course.model_dump(mode="json") for course in records]
    vectors = await asyncio.to_thread(
        embed_texts,
        [embedding_text(course) for course in records],
    )
    for document, vector in zip(documents, vectors, strict=True):
        document["embedding"] = vector
        document["embedding_model"] = settings.EMBEDDING_MODEL

    source_filter = {
        "college_name": college_name,
        "department_name": department_name,
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
