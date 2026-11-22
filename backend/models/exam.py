from pydantic import BaseModel, HttpUrl


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
    exam: str
    year: int
    source_url: HttpUrl
    events: list[ExamTimelineEvent]
