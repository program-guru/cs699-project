from pydantic import BaseModel


class Stats(BaseModel):
    universities: int
    courses: int
