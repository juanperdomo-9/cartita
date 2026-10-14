from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models import Carta
from app.routers import almacen, cartas, familia, publica, seguimiento
from app.vista_previa import POR_DEFECTO, con_vista_previa


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


# La página se pide siempre de nuevo: así, después de cada deploy, nadie se queda con la versión
# vieja. Los archivos de /assets tienen el hash en el nombre y se pueden guardar sin problema.
SIN_CACHE = {"Cache-Control": "no-cache"}


def servir_frontend(app: FastAPI, settings: Settings) -> None:
    """Un solo servicio: la API y la web compilada (React) salen del mismo lugar.

    Todas las rutas que no son de la API devuelven index.html (React Router se encarga).
    """
    dist = settings.frontend_dist.resolve()
    # La imagen de la vista previa de WhatsApp necesita la URL completa del sitio.
    index = (dist / "index.html").read_text(encoding="utf-8")
    index = index.replace("%VITE_SITIO_URL%", settings.frontend_url)
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/c/{slug}", include_in_schema=False)
    def carta_de_ella(slug: str, db: Annotated[Session, Depends(get_db)]) -> HTMLResponse:
        # La vista previa de WhatsApp del link de ella: la frase neutra que eligió quien la armó.
        clave = db.scalar(
            select(Carta.vista_previa).where(Carta.slug == slug, Carta.estado == "publicada")
        )
        pagina = con_vista_previa(index, clave or POR_DEFECTO, settings.frontend_url)
        return HTMLResponse(pagina, headers=SIN_CACHE)

    @app.get("/{ruta:path}", include_in_schema=False)
    def web(ruta: str):
        if ruta.startswith("api/"):
            raise HTTPException(404, "No existe.")
        archivo = (dist / ruta).resolve()
        if ruta and archivo.is_file() and dist in archivo.parents:
            return FileResponse(archivo)
        # Un archivo que no existe (imagen, ícono…) es 404; las rutas de la web, index.html.
        if "." in ruta.rsplit("/", 1)[-1]:
            raise HTTPException(404, "No existe.")
        return HTMLResponse(index, headers=SIN_CACHE)


app = crear_app()
