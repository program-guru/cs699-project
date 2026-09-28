#!/usr/bin/env bash
set -e

echo "==> Running post-create setup for Uni Scope"

# --- Frontend deps (Next.js) ---
if [ -f "frontend/package.json" ]; then
  echo "==> Installing frontend dependencies"
  (cd frontend && npm install)
else
  echo "==> Skipping frontend install (frontend/package.json not found yet)"
fi

# --- Backend deps (FastAPI) ---
if [ -f "backend/pyproject.toml" ]; then
  echo "==> Installing backend dependencies"
  (cd backend && uv sync)
else
  echo "==> Skipping backend install (backend/pyproject.toml not found yet)"
fi

# --- Backend env file ---
if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
  echo "==> Creating backend/.env from .env.example"
  cp backend/.env.example backend/.env
fi

# --- Sanity checks ---
echo "==> Versions:"
python3 --version
node --version
npm --version

echo "==> Post-create setup complete."
echo "    Mongo is reachable at mongodb://mongo:27017/uniscope"