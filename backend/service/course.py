import re
from typing import Literal

from bson import ObjectId
from bson.errors import InvalidId
from core.config import settings
from models.course import Course, CoursePage, CourseRead, SimilarCourse
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.operations import SearchIndexModel

from service.embedding import embedding_fields


async def ensure_vector_index(database: AsyncDatabase) -> None:
    collection = database["courses"]
    existing = {index["name"] async for index in await collection.list_search_indexes()}
    if settings.VECTOR_INDEX_NAME in existing:
        return

    await collection.create_search_index(
        SearchIndexModel(
            name=settings.VECTOR_INDEX_NAME,
            type="vectorSearch",
            definition={
                "fields": [
                    {
                        "type": "vector",
                        "path": "embedding",
                        "numDimensions": settings.EMBEDDING_DIMENSIONS,
                        "similarity": "cosine",
                    },
                    {"type": "filter", "path": "college_id"},
                    {"type": "filter", "path": "department_id"},
                ]
            },
        )
    )

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


async def update_course_embedding(
    database: AsyncDatabase, course_id: str, course: Course
) -> None:
    object_id = _course_id(course_id)
    if object_id is None:
        raise ValueError(f"Invalid course ID: {course_id}")

    fields = embedding_fields(course)
    result = await database["courses"].update_one(
        {"_id": object_id},
        {"$set": fields},
    )
    if result.matched_count == 0:
        raise ValueError(f"Course not found while updating embedding: {course_id}")


async def list_courses(
    database: AsyncDatabase,
    college_id: str | None = None,
    department_id: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> CoursePage:
    filters: dict[str, object] = {}
    if college_id is not None:
        filters["college_id"] = college_id
    if department_id is not None:
        filters["department_id"] = department_id
    if search:
        search_pattern = re.escape(search)
        filters["$or"] = [
            {"college_name": {"$regex": search_pattern, "$options": "i"}},
            {"department_name": {"$regex": search_pattern, "$options": "i"}},
            {"course_code": {"$regex": search_pattern, "$options": "i"}},
            {"title": {"$regex": search_pattern, "$options": "i"}},
        ]

    collection = database["courses"]
    total = await collection.count_documents(filters)
    cursor = (
        collection
        .find(filters, {"embedding": 0, "embedding_model": 0})
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
    )


async def get_course(database: AsyncDatabase, course_id: str) -> CourseRead | None:
    object_id = _course_id(course_id)
    if object_id is None:
        return None

    document = await database["courses"].find_one(
        {"_id": object_id}, {"embedding": 0, "embedding_model": 0}
    )
    return CourseRead.model_validate(document) if document else None


async def update_course(
    database: AsyncDatabase, course_id: str, course: Course
) -> Literal["updated", "not_found"]:
    object_id = _course_id(course_id)
    if object_id is None:
        return "not_found"

    fields = course.model_dump(mode="json", exclude_none=False)
    result = await database["courses"].update_one({"_id": object_id}, {"$set": fields})
    return "updated" if result.matched_count > 0 else "not_found"


async def find_similar_courses(
    database: AsyncDatabase,
    course_id: str,
    limit: int = 10,
    cross_department: bool = False,
) -> list[SimilarCourse] | Literal["not_found", "no_embedding"]:
    object_id = _course_id(course_id)
    if object_id is None:
        return "not_found"

    primary = await database["courses"].find_one(
        {"_id": object_id},
        {"embedding": 1, "embedding_model": 1, "college_id": 1, "department_id": 1},
    )
    if primary is None:
        return "not_found"
    if (
        not primary.get("embedding")
        or primary.get("embedding_model") != settings.EMBEDDING_MODEL
    ):
        return "no_embedding"

    vector_filter: dict[str, object] = {
        "college_id": {"$ne": primary["college_id"]}
    }
    if not cross_department:
        vector_filter["department_id"] = primary["department_id"]

    cursor = await database["courses"].aggregate(
        [
            {
                "$vectorSearch": {
                    "index": settings.VECTOR_INDEX_NAME,
                    "path": "embedding",
                    "queryVector": primary["embedding"],
                    "exact": True,
                    "limit": limit,
                    "filter": vector_filter,
                }
            },
            {"$set": {"score": {"$meta": "vectorSearchScore"}}},
            {"$project": {"embedding": 0, "embedding_model": 0}},
        ]
    )
    return [SimilarCourse.model_validate(document) async for document in cursor]


async def delete_course(
    database: AsyncDatabase, course_id: str
) -> Literal["deleted", "not_found"]:
    object_id = _course_id(course_id)
    if object_id is None:
        return "not_found"

    result = await database["courses"].delete_one({"_id": object_id})
    return "deleted" if result.deleted_count > 0 else "not_found"
