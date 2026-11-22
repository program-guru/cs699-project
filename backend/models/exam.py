from pydantic import BaseModel, HttpUrl

from models.catalog import Exam


class ExamDateValue(BaseModel):
    value: str
    revised: bool = False


class ExamTimelineEventCreate(BaseModel):
    activity: str
    dates: list[ExamDateValue]
    days: list[ExamDateValue]


class ExamTimelineEvent(ExamTimelineEventCreate):
    position: int


class ExamTimeline(BaseModel):
    exam: Exam
    year: int
    source_url: HttpUrl
    events: list[ExamTimelineEvent]
