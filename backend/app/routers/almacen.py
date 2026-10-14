"""Solo en desarrollo (sin SUPABASE_URL): sirve y recibe archivos con links firmados.

Imita a Supabase Storage para probar el flujo completo en la compu. En producción no se monta.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, Response

from app.services.archivos import MAX_AUDIO
from app.services.storage import AlmacenLocal, get_almacen

router = APIRouter(prefix="/api/almacen", tags=["almacen (desarrollo)"])

Vence = Annotated[int, Query()]
Firma = Annotated[str, Query()]


def _local() -> AlmacenLocal:
    almacen = get_almacen()
    assert isinstance(almacen, AlmacenLocal)
    return almacen


@router.put("/subir/{ruta:path}", status_code=200)
async def subir(ruta: str, vence: Vence, firma: Firma, request: Request) -> dict[str, str]:
    almacen = _local()
    if not almacen.firma_valida("subir", ruta, vence, firma):
        raise HTTPException(403, "Link de subida vencido o inválido.")
    datos = await request.body()
    if len(datos) > MAX_AUDIO:
        raise HTTPException(413, "Archivo demasiado grande.")
    destino = almacen.archivo(ruta)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(datos)
    return {"Key": ruta}


@router.get("/ver/{ruta:path}")
def ver(ruta: str, vence: Vence, firma: Firma) -> Response:
    almacen = _local()
    if not almacen.firma_valida("ver", ruta, vence, firma):
        raise HTTPException(403, "Link vencido o inválido.")
    destino = almacen.archivo(ruta)
    if not destino.exists():
        raise HTTPException(404, "No existe.")
    return FileResponse(destino)
