from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from models.catalog import Exam
from models.exam import ExamTimeline, ExamTimelineEvent


async def replace_exam_timeline(
    database: AsyncDatabase,
    exam: Exam,
    year: int,
    source_url: str,
    records: list[dict[str, Any]],
) -> int:
    collection = database["exam_events"]
    events = [
        ExamTimelineEvent(
            position=index,
            activity=record["activity"],
            dates=record["dates"],
            days=record["days"],
        )
        for index, record in enumerate(records)
    ]
    documents = [
        {
            "exam": exam.value,
            "year": year,
            "source_url": source_url,
            "position": event.position,
            "activity": event.activity,
            "dates": [date.model_dump(mode="json") for date in event.dates],
            "days": [day.model_dump(mode="json") for day in event.days],
        }
        for event in events
    ]

    await collection.delete_many({"exam": exam.value, "year": year})
    if documents:
        await collection.insert_many(documents)
    return len(documents)


async def get_exam_timeline(
    database: AsyncDatabase,
    exam: Exam,
    year: int,
) -> ExamTimeline | None:
    collection = database["exam_events"]
    cursor = (
        collection.find(
            {"exam": exam.value, "year": year},
            {"_id": 0},
        )
        .sort("position", 1)
    )
    documents = [document async for document in cursor]
    if not documents:
        return None

    return ExamTimeline(
        exam=documents[0]["exam"],
        year=documents[0]["year"],
        source_url=documents[0]["source_url"],
        events=[
            ExamTimelineEvent(
                position=document["position"],
                activity=document["activity"],
                dates=document["dates"],
                days=document["days"],
            )
            for document in documents
        ],
    )
