from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class ComparisonSummary(BaseModel):
    primary_course_id: PyObjectId
    secondary_course_id: PyObjectId
    overview: str
    similarities: list[str] = Field(default_factory=list)
    differences: list[str] = Field(default_factory=list)
    prerequisites_and_difficulty: str
    recommendation: str
    data_limitations: str | None = None
    model: str
    generated_at: datetime