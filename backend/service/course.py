import asyncio
from typing import Literal

from bson import ObjectId
from bson.errors import InvalidId
from models.course import Course, CoursePage, CourseRead, CourseStats
from pymongo.asynchronous.database import AsyncDatabase


def _course_id(course_id: str) -> ObjectId | None:
    try:
        return ObjectId(course_id)
    except InvalidId:
        return None


async def create_course(database: AsyncDatabase, course: Course) -> CourseRead:
    document = course.model_dump(mode="json", exclude_none=False)
    result = await database["courses"].insert_one(document)
    document["_id"] = result.inserted_id
    return CourseRead.model_validate(document)


async def list_courses(
    database: AsyncDatabase,
    college_id: str | None = None,
    department_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> CoursePage:
    filters: dict[str, str] = {}
    if college_id is not None:
        filters["college_id"] = college_id
    if department_id is not None:
        filters["department_id"] = department_id

    collection = database["courses"]
    total = await collection.count_documents(filters)
    cursor = (
        collection
        .find(filters)
        .sort([("college_id", 1), ("department_id", 1), ("course_code", 1)])
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    courses = [CourseRead.model_validate(document) async for document in cursor]
    return CoursePage(
        courses=courses,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


async def get_course_stats(database: AsyncDatabase) -> CourseStats:
    collection = database["courses"]
    universities, courses = await asyncio.gather(
        collection.distinct("college_id"),
        collection.count_documents({}),
    )
    return CourseStats(universities=len(universities), courses=courses)


async def get_course(database: AsyncDatabase, course_id: str) -> CourseRead | None:
    object_id = _course_id(course_id)
    if object_id is None:
        return None

    document = await database["courses"].find_one({"_id": object_id})
    return CourseRead.model_validate(document) if document else None


async def update_course(
    database: AsyncDatabase, course_id: str, course: Course
) -> Literal["updated", "not_found"]:
    object_id = _course_id(course_id)
    if object_id is None:
        return "not_found"

    result = await database["courses"].update_one(
        {"_id": object_id},
        {"$set": course.model_dump(mode="json", exclude_none=False)},
    )
    return "updated" if result.matched_count > 0 else "not_found"


async def delete_course(
    database: AsyncDatabase, course_id: str
) -> Literal["deleted", "not_found"]:
    object_id = _course_id(course_id)
    if object_id is None:
        return "not_found"

    result = await database["courses"].delete_one({"_id": object_id})
    return "deleted" if result.deleted_count > 0 else "not_found"
