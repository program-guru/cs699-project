from pydantic import BaseModel


class CollegeOption(BaseModel):
    id: str
    name: str


class DepartmentOption(BaseModel):
    id: str
    name: str


class Stats(BaseModel):
    universities: int
    courses: int
