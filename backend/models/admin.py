from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

PyObjectId = Annotated[str, BeforeValidator(str)]

class AdminModel(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    username: str
    password: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "username": "admin",
                "password": "pass123",
            }
        }
    )
