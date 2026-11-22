from datetime import UTC, datetime
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, HttpUrl

from models.catalog import College, Department

PyObjectId = Annotated[str, BeforeValidator(str)]


class Course(BaseModel):
    college_name: College
    department_name: Department

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
    scraped_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Preserve fields that don't fit the common schema.
    raw_extra: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "college_name": "IIT Bombay",
                "department_name": "Computer Science and Engineering",
                "course_code": "CS101",
                "title": "Introduction to Computer Science",
                "category": "Core",
                "level": "UG",
                "credits": 4.0,
                "description": "An introductory course on computer science.",
                "prerequisites": ["None"],
                "instructor": "Prof. John Doe",
                "semester_offered": "Autumn",
                "syllabus_url": "https://www.iitb.ac.in/courses/cs101/syllabus.pdf",
                "source_url": "https://www.iitb.ac.in/courses/cs101",
            }
        },
    )


class CourseRead(Course):
    id: PyObjectId | None = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class CoursePage(BaseModel):
    courses: list[CourseRead]
    page: int
    page_size: int
    total: int


class SimilarCourse(CourseRead):
    score: float

class DeleteCoursesRequest(BaseModel):
    college_name: College
    department_name: Department