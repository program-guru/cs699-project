import asyncio

from models.misc import CollegeOption, DepartmentOption, Stats
from pymongo.asynchronous.database import AsyncDatabase


async def get_course_stats(database: AsyncDatabase) -> Stats:
    collection = database["courses"]
    colleges, courses = await asyncio.gather(
        collection.distinct("college_id"),
        collection.count_documents({}),
    )
    return Stats(universities=len(colleges), courses=courses)


async def get_colleges(database: AsyncDatabase) -> list[CollegeOption]:
    cursor = await database["courses"].aggregate(
        [
            {
                "$group": {
                    "_id": "$college_id",
                    "name": {"$first": "$college_name"},
                }
            },
            {"$sort": {"name": 1, "_id": 1}},
        ]
    )
    documents = await cursor.to_list()
    return [
        CollegeOption(id=document["_id"], name=document["name"])
        for document in documents
    ]


async def get_departments(
    database: AsyncDatabase,
    college_id: str | None = None,
) -> list[DepartmentOption]:
    match = {"college_id": college_id} if college_id is not None else {}
    cursor = await database["courses"].aggregate(
        [
            {"$match": match},
            {
                "$group": {
                    "_id": "$department_id",
                    "name": {"$first": "$department_name"},
                }
            },
            {"$sort": {"name": 1, "_id": 1}},
        ]
    )
    documents = await cursor.to_list()
    return [
        DepartmentOption(id=document["_id"], name=document["name"])
        for document in documents
    ]
