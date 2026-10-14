from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


def crear_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Cartita", docs_url="/api/docs", openapi_url="/api/openapi.json")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["salud"])
    def health() -> dict[str, str]:
        return {"estado": "ok"}

    return app


app = crear_app()
