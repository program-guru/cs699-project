from typing import Generic, TypeVar
from pydantic import BaseModel

# Define a generic type variable
T = TypeVar('T')

class DTO(BaseModel, Generic[T]):
    success: bool
    message: str
    data: T | None = None
