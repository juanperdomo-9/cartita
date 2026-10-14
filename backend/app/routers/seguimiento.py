"""Seguimiento (`/e/{token_admin}`): solo con el token de quien la armó."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.db import get_db
from app.services.cartas import ahora, por_admin, publica
from app.services.tokens import descifrar_familia

router = APIRouter(prefix="/api/e", tags=["seguimiento"])

Db = Annotated[Session, Depends(get_db)]


@router.get("/{token}")
def ver(token: str, db: Db) -> schemas.Seguimiento:
    carta = por_admin(db, token)
    lectura = carta.lectura
    return schemas.Seguimiento(
        id=carta.id,
        slug=carta.slug,
        token_familia=descifrar_familia(carta.token_familia_cifrado, token),
        ocasion=carta.ocasion,
        estado=carta.estado,
        para=carta.para,
        de=carta.de,
        abre_desde=carta.abre_desde,
        creada_a=carta.creada_a,
        ahora=ahora(),
        lectura=schemas.LecturaSeguimiento(
            visto_a=lectura.visto_a,
            abierta_a=lectura.abierta_a,
            abrazos=lectura.abrazos,
            respuesta=lectura.respuesta,
            respuesta_a=lectura.respuesta_a,
        )
        if lectura
        else schemas.LecturaSeguimiento(),
        mensajes=[
            schemas.MensajeSeguimiento(
                id=m.id,
                nombre=m.nombre,
                texto=m.texto,
                visible=m.visible,
                con_foto=any(a.tipo == "foto" and a.confirmado for a in m.archivos),
                con_audio=any(a.tipo == "audio" and a.confirmado for a in m.archivos),
                creado_a=m.creado_a,
            )
            for m in carta.mensajes
        ],
    )


@router.get("/{token}/carta")
def ver_carta(token: str, db: Db) -> schemas.CartaPublica:
    """La carta completa para quien la armó. No registra `visto` ni `abierta`."""
    return publica(por_admin(db, token), con_contenido=True)


@router.patch("/{token}/mensajes/{mensaje_id}")
def cambiar_mensaje(
    token: str, mensaje_id: uuid.UUID, cambio: schemas.CambioMensaje, db: Db
) -> dict[str, bool]:
    carta = por_admin(db, token)
    mensaje = next((m for m in carta.mensajes if m.id == mensaje_id), None)
    if not mensaje:
        raise HTTPException(404, "No encontramos ese mensaje.")
    mensaje.visible = cambio.visible
    db.commit()
    return {"visible": mensaje.visible}
