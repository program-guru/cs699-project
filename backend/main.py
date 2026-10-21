from contextlib import asynccontextmanager
from typing import Any, cast
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from api.exception_handlers import general_exception_handler, validation_exception_handler, http_exception_handler
from api.routers.admin import router as admin_router
from api.routers.auth import router as auth_router
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

app.add_exception_handler(HTTPException, cast(Any, http_exception_handler))
app.add_exception_handler(RequestValidationError, cast(Any, validation_exception_handler))
app.add_exception_handler(Exception, cast(Any, general_exception_handler))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)