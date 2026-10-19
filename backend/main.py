from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router)