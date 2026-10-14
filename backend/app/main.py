from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import almacen, cartas, familia, publica, seguimiento


def crear_app() -> FastAPI:
    settings = get_settings()
    settings.pepper  # noqa: B018 (en producción falla al arrancar si falta TOKEN_PEPPER)
    if settings.es_produccion and not settings.usa_supabase:
        raise RuntimeError("En producción hace falta SUPABASE_URL (los archivos van a Storage)")
    app = FastAPI(title="Cartita", docs_url="/api/docs", openapi_url="/api/openapi.json")

    # En desarrollo también se aceptan IPs de la red local, para probar desde el celular.
    red_local = r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_origin_regex=None if settings.es_produccion else red_local,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def sin_indexar(request: Request, call_next):
        respuesta = await call_next(request)
        respuesta.headers["X-Robots-Tag"] = "noindex"
        return respuesta

    @app.get("/health", tags=["salud"])
    def health() -> dict[str, str]:
        return {"estado": "ok"}

    for r in (cartas, publica, familia, seguimiento):
        app.include_router(r.router)
    if not settings.usa_supabase:
        app.include_router(almacen.router)

    return app


app = crear_app()
