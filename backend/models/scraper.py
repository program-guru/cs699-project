from pydantic import BaseModel, Field, model_validator


class ScrapeRequest(BaseModel):
    college_id: str | None = None
    department_id: str | None = None

    @model_validator(mode="after")
    def require_college_for_department(self) -> "ScrapeRequest":
        if self.department_id and not self.college_id:
            raise ValueError("college_id is required when department_id is provided")
        return self


class DeleteCoursesRequest(BaseModel):
    college_id: str = Field(min_length=1)
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
