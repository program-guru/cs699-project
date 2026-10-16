
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class Course(BaseModel):
    college_id: str
    college_name: str

    department_id: str
    department_name: str

    course_code: str | None = None
    title: str
    category: str | None = None
    level: str | None = None
    credits: float | None = None

    description: str | None = None
    prerequisites: list[str] = Field(default_factory=list)
    instructor: str | None = None
    semester_offered: str | None = None
    syllabus_url: HttpUrl | None = None

    source_url: HttpUrl
    scraped_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Preserve fields that don't fit the common schema.
    raw_extra: dict[str, Any] = Field(default_factory=dict)
