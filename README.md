# UniScope

UniScope is a course discovery and exam information platform. The repository
contains a Next.js frontend and a FastAPI backend backed by MongoDB.

## Repository layout

```text
.
├── backend/       FastAPI API, services, scrapers, and data models
├── frontend/      Next.js application and UI
├── .devcontainer/ VS Code development container and MongoDB service
└── scripts/       Development-container setup scripts
```

## Quick start

### Option 1: VS Code Dev Container (recommended)

Prerequisites:

- [Docker](https://docs.docker.com/get-docker/)
- [Visual Studio Code](https://code.visualstudio.com/)
- The [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

1. Open this repository in VS Code.
2. Run **Dev Containers: Reopen in Container** from the Command Palette.
3. Wait for the post-create setup to install frontend and backend dependencies.
4. Configure `backend/.env` with the required backend settings. The container
   can reach MongoDB at `mongodb://mongo:27017/uniscope`.
5. Start the services in separate terminals:

   ```bash
   # Terminal 1
   cd backend
   uv run fastapi dev

   # Terminal 2
   cd frontend
   pnpm dev
   ```

Open the frontend at <http://localhost:3000>. The API and interactive
documentation are available at <http://localhost:8000> and
<http://localhost:8000/docs>.

The devcontainer forwards ports 3000 (frontend), 8000 (backend), and 27017
(MongoDB). Its `mongo` service persists database data in Docker volumes.

### Option 2: Run locally

Prerequisites:

- Python 3.13 or newer
- [uv](https://docs.astral.sh/uv/)
- Node.js 20.9 or newer
- [pnpm](https://pnpm.io/installation)
- MongoDB

Install dependencies and start each application from the repository root:

```bash
cd backend
uv sync
uv run fastapi dev
```

In another terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend defaults to `http://localhost:8000` for the API. To use another
API origin, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Before starting the backend, create or update `backend/.env` with at least a
MongoDB URI, JWT secret, root credentials, and frontend origin. See the
[backend configuration guide](backend/README.md#configuration) for the full
configuration reference. Do not commit environment files or credentials.

## Development

Run frontend checks from `frontend/`:

```bash
pnpm lint
pnpm build
```

Run backend tooling from `backend/`:

```bash
uv run ruff check .
```

The backend API requires MongoDB during startup. The frontend and backend are
separate applications, so run them in separate terminals and keep
`FRONTEND_URL` aligned with the frontend origin.

## Documentation

- [Backend README](backend/README.md) - FastAPI setup, environment variables,
  database lifecycle, API routes, scrapers, and backend development notes.
- [Frontend README](frontend/README.md) - Next.js setup, routes, state and API
  integration, UI conventions, and frontend development commands.

## Service flow

```text
Browser ──HTTP/JSON + cookie──> Next.js frontend ──HTTP/JSON + cookie──> FastAPI backend ──> MongoDB
```

The backend owns authentication, authorization, persistence, scraping, and
AI comparison services. The frontend owns the user interface and uses RTK
Query to call the backend. Authentication uses an HTTP-only `access_token`
cookie; the frontend must send requests with credentials enabled.
