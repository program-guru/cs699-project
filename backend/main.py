from contextlib import asynccontextmanager
from fastapi import FastAPI

from api.routers.admin import router as login_router
from core.database import close_database_connection, get_database
from service.admin import initialize_database
from core.config import settings

@asynccontextmanager
async def lifespan(_: FastAPI):
    await initialize_database(get_database())
    yield
    await close_database_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)


app.include_router(login_router)