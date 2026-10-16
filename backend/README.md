# backend

A project created with FastAPI CLI.

## Quick Start

### Start the development server

```bash
uv run fastapi dev
```

Visit http://localhost:8000

### Deploy to FastAPI Cloud

Sign up and log in at https://fastapicloud.com, then deploy with:

```bash
uv run fastapi deploy
```

## Project Structure

- `main.py` - Your FastAPI application
- `pyproject.toml` - Project dependencies

## MongoDB

Set `DATABASE_URI` in `backend/.env` to a MongoDB connection string that
includes the database name:

```env
DATABASE_URI=mongodb://localhost:27017/uniscope
```

The shared async client and the FastAPI database dependency are available from
`core.database`:

```python
from typing import Annotated

from fastapi import Depends
from pymongo.asynchronous.database import AsyncDatabase

from core.database import get_database_session

Database = Annotated[AsyncDatabase, Depends(get_database_session)]
```

The client is created lazily and reused across requests. Call
`close_database_connection()` from the application's shutdown lifecycle.

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [FastAPI Cloud](https://fastapicloud.com)
