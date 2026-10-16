from contextlib import asynccontextmanager

from fastapi import FastAPI

from core.database import close_database_connection


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_database_connection()


app = FastAPI(lifespan=lifespan)

@app.get("/")
def main():
    return {"message": "Hello World"}
