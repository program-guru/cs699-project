# backend

A project created with FastAPI CLI.

## Quick Start

### Start the development server

```bash
uv run fastapi dev
```

Visit http://localhost:8000

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

## Authentication

The `POST /admin/login` endpoint accepts JSON credentials and sets the JWT in
an HttpOnly cookie:

```bash
curl -i -c cookies.txt -X POST http://localhost:8000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass123"}'
```

The response body contains a success message; the token is not exposed in JSON.
Admins are read from the `admins` collection. Store passwords as Argon2 hashes
generated with `pwdlib`; never store plaintext passwords. Configure `SECRET_KEY`,
`ALGORITHM`, and `ACCESS_TOKEN_EXPIRE_MINUTES` in the environment before issuing
tokens.

The following admin-management endpoints require the `access_token` cookie
created by login:

- `POST /admin/` creates an admin.
- `PUT /admin/{username}` updates an admin's username and password.
- `DELETE /admin/{username}` deletes an admin.

All admin passwords are hashed before being stored.

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [FastAPI Cloud](https://fastapicloud.com)
