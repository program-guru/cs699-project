from fastapi import Depends
from typing_extensions import Annotated
from pymongo.asynchronous.database import AsyncDatabase

from core.database import get_database_session

DBSession = Annotated[AsyncDatabase, Depends(get_database_session)]