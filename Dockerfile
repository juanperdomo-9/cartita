# Cartita en un solo servicio: FastAPI sirve la API y la web compilada.

# 1) Frontend: React + Vite -> frontend/dist
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Backend: Python 3.12 con uv
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.12.20 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist
ENV PATH="/app/backend/.venv/bin:$PATH" FRONTEND_DIST=/app/frontend/dist

# Las migraciones corren al arrancar (el plan free de Render no tiene pre-deploy).
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
