from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.config import Settings, get_settings
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
    if settings.frontend_dist and (settings.frontend_dist / "index.html").exists():
        servir_frontend(app, settings)

    return app


def servir_frontend(app: FastAPI, settings: Settings) -> None:
    """Un solo servicio: la API y la web compilada (React) salen del mismo lugar.

    Todas las rutas que no son de la API devuelven index.html (React Router se encarga).
    """
    dist = settings.frontend_dist.resolve()
    # La imagen de la vista previa de WhatsApp necesita la URL completa del sitio.
    index = (dist / "index.html").read_text(encoding="utf-8")
    index = index.replace("%VITE_SITIO_URL%", settings.frontend_url)
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{ruta:path}", include_in_schema=False)
    def web(ruta: str):
        if ruta.startswith("api/"):
            raise HTTPException(404, "No existe.")
        archivo = (dist / ruta).resolve()
        if ruta and archivo.is_file() and dist in archivo.parents:
            return FileResponse(archivo)
        return HTMLResponse(index)


app = crear_app()
