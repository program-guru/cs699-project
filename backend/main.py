from contextlib import asynccontextmanager
from fastapi import FastAPI

from api.routers.admin import router as login_router
from core.database import close_database_connection

@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_database_connection()


app = FastAPI(lifespan=lifespan)
app.include_router(login_router)

@app.get("/")
def main():
    return {"message": "Hello World"}
