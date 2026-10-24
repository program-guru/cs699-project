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

The response body contains the authenticated admin's MongoDB ID and username;
the token is not exposed in JSON. The JWT stores the MongoDB ID as `sub` and
the username as `username`.
Admins are read from the `admins` collection. Store passwords as Argon2 hashes
generated with `pwdlib`; never store plaintext passwords. Configure `SECRET_KEY`,
`ALGORITHM`, and `ACCESS_TOKEN_EXPIRE_MINUTES` in the environment before issuing
tokens. Tokens identify admins by their immutable MongoDB document ID, so an
admin can change its username without invalidating the current session.

The application creates an immutable root admin during startup. Its default
credentials are `root`/`root`; set `ROOT_PASSWORD` before first startup to
choose a different initial password. The root record is created only when
missing, so its password is never reset on later startups.
Admin usernames are enforced as unique by a MongoDB unique index. The root
admin cannot be created, updated, or deleted through the API.

The following admin-management endpoints require the `access_token` cookie
created by login:

- `POST /admin/` creates an admin.
- `PUT /admin/{admin_id}` updates an admin's username and password.
- `DELETE /admin/{admin_id}` deletes an admin.

Deleting the currently authenticated admin also clears its authentication
cookie and ends the session.

All admin passwords are hashed before being stored.

## Course scraping

The protected `POST /scrape/` endpoint starts a background refresh for a
registered source and returns `202 Accepted`. The background task scrapes and
validates the source, then replaces the matching documents in the `courses`
collection. A valid `access_token` cookie is required:

```bash
curl -b cookies.txt -X POST \
  http://localhost:8000/scrape/ \
  -H "Content-Type: application/json" \
  -d '{"college_id":"iitm","department_id":"cse"}'
```

The registered sources can be found in `scrapers/registry.py`. Other course
endpoints can read the refreshed documents directly from MongoDB. Refreshes
use a MongoDB transaction so a failed write does not remove the previous
course snapshot when MongoDB runs as a replica set or through `mongos`. A
standalone MongoDB deployment does not support transactions; in that
configuration the refresh uses a delete-then-insert sequence instead. Use a
replica set for atomic refreshes.

## Course API

Course reads are public:

- `GET /courses/` lists courses with `page` (default `1`) and `page_size`
  (default `20`, maximum `100`) pagination parameters. It also supports
  optional `college_id` and `department_id` filters. The response includes
  `courses`, `page`, `page_size`, `total`, and `total_pages`.
- `GET /courses/{course_id}` retrieves one course by its MongoDB ID.

Course writes require the authenticated admin cookie:

- `POST /courses/` creates a course.
- `PUT /courses/{course_id}` replaces a course.
- `DELETE /courses/{course_id}` deletes a course.

Course responses use the standard `DTO` envelope and include the MongoDB
document ID as `_id`.

## Response format

Successful and error responses use the `DTO` envelope:

```json
{
  "success": false,
  "message": "Validation error: body -> username: Field required",
  "data": null
}
```

HTTP exceptions, request validation errors, and unexpected server errors are
converted to this format by the application's exception handlers.

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [FastAPI Cloud](https://fastapicloud.com)
