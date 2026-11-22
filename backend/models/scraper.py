from pydantic import BaseModel, Field


class ScrapeRequest(BaseModel):
    college_id: str | None = None
    department_id: str | None = None


class DeleteCoursesRequest(BaseModel):
    college_id: str | None = Field(default=None, min_length=1)
    department_id: str | None = Field(default=None, min_length=1)


class ScrapeSource(BaseModel):
    college_id: str
    department_id: str
    college_name: str
    department_name: str


class ScrapeResult(BaseModel):
    college_id: str
    department_id: str
    count: int
