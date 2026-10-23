from pydantic import BaseModel


class ScrapeResult(BaseModel):
    college_id: str
    department_id: str
    count: int
