from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    college_id: str
    department_id: str


class ScrapeResult(BaseModel):
    college_id: str
    department_id: str
    count: int
