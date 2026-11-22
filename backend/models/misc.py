from pydantic import BaseModel

from models.catalog import College, Department


class Stats(BaseModel):
    universities: int
    courses: int

class ScrapeRequest(BaseModel):
    college_name: College
    department_name: Department