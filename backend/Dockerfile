
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /uvx /bin/

WORKDIR /app

# uv configuration
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONUNBUFFERED=1

# Copy dependency metadata first for build caching
COPY pyproject.toml uv.lock ./

# Install dependencies using your existing lockfile
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# Copy backend source and configuration/data files
COPY . .

# Install the project if configured as an installable package
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

ENV PATH="/app/.venv/bin:$PATH"

# Change this if your application uses a different port
EXPOSE 8000

CMD ["uv", "run", "--no-sync", "python", "main.py"]
