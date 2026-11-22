from pydantic import BaseModel

from models.catalog import College, Department


class ScrapeRequest(BaseModel):
    college_name: College
    department_name: Department


class ScrapeResult(BaseModel):
    college_name: College
    department_name: Department
    count: int
