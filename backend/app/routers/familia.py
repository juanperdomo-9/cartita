"""Link de la familia (`/s/{token_familia}`): suman un mensaje con foto o audio. No ven la carta."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import schemas
from app.db import get_db
from app.models import MensajeFamilia
from app.routers.cartas import nuevo_archivo
from app.services.archivos import MAX_MENSAJES_FAMILIA
from app.services.cartas import por_familia
from app.services.limites import limitar

router = APIRouter(prefix="/api/s", tags=["familia"])

Db = Annotated[Session, Depends(get_db)]


@router.get("/{token}")
def ver(token: str, db: Db) -> schemas.CartaParaFamilia:
    carta = por_familia(db, token)
    return schemas.CartaParaFamilia(ocasion=carta.ocasion, para=carta.para, de=carta.de)


@router.post(
    "/{token}/mensajes", status_code=201, dependencies=[Depends(limitar("mensaje_familia"))]
)
def sumar_mensaje(token: str, datos: schemas.MensajeCrear, db: Db) -> schemas.MensajeCreado:
    carta = por_familia(db, token)
    cantidad = db.scalar(
        select(func.count()).select_from(MensajeFamilia).where(MensajeFamilia.carta_id == carta.id)
    )
    if cantidad >= MAX_MENSAJES_FAMILIA:
        raise HTTPException(422, "Esta carta ya tiene muchos mensajes.")
    mensaje = MensajeFamilia(carta_id=carta.id, nombre=datos.nombre, texto=datos.texto)
    db.add(mensaje)
    db.commit()
    return schemas.MensajeCreado(id=mensaje.id)


@router.post(
    "/{token}/mensajes/{mensaje_id}/archivos",
    status_code=201,
    dependencies=[Depends(limitar("archivo"))],
)
def pedir_subida(
    token: str, mensaje_id: uuid.UUID, pedido: schemas.PedidoArchivo, db: Db
) -> schemas.ArchivoFirmado:
    carta = por_familia(db, token)
    mensaje = db.get(MensajeFamilia, mensaje_id)
    if not mensaje or mensaje.carta_id != carta.id:
        raise HTTPException(404, "No encontramos ese mensaje.")
    quien = mensaje.nombre[:30] if pedido.tipo == "audio" else ""
    return nuevo_archivo(db, carta, pedido, "familia", mensaje=mensaje, quien=quien)
