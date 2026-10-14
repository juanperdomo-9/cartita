"""Seguimiento (`/e/{token_admin}`): solo con el token de quien la armó."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.db import get_db
from app.models import Archivo
from app.ocasiones import OCASIONES
from app.routers.cartas import campos_validados
from app.services.cartas import ahora, por_admin, publica
from app.services.limites import limitar
from app.services.storage import get_almacen
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


# ---------- Editar la carta después de crearla ----------
def _link_cancion(tipo: str | None, id_: str | None) -> str | None:
    if tipo == "youtube":
        return f"https://www.youtube.com/watch?v={id_}"
    if tipo == "spotify":
        return f"https://open.spotify.com/track/{id_}"
    return None


@router.get("/{token}/editar")
def para_editar(token: str, db: Db) -> schemas.CartaParaEditar:
    """Los textos tal cual y los archivos de quien la armó (no los de la familia), con su id."""
    carta = por_admin(db, token)
    propios = [a for a in carta.archivos if a.confirmado and a.mensaje_id is None]
    urls = get_almacen().firmar_lecturas([a.ruta for a in propios])
    return schemas.CartaParaEditar(
        id=carta.id,
        datos=schemas.CartaCrear(
            ocasion=carta.ocasion,
            para=carta.para,
            de=carta.de,
            desde=carta.desde,
            titulo=carta.titulo,
            subtitulo=carta.subtitulo,
            carta=carta.carta,
            lugar=carta.lugar,
            recuerdo=carta.recuerdo,
            polas=carta.polas,
            antes_txt=carta.antes_txt,
            ahora_txt=carta.ahora_txt,
            gracias=carta.gracias,
            cancion=_link_cancion(carta.cancion_tipo, carta.cancion_id),
            cancion_nombre=carta.cancion_nombre,
            regalo_titulo=carta.regalo_titulo,
            regalo_detalle=carta.regalo_detalle,
            estilo=carta.estilo,
            vista_previa=carta.vista_previa,
            abre_desde=carta.abre_desde,
        ),
        archivos=[
            schemas.ArchivoGuardado(
                id=a.id,
                tipo=a.tipo,
                rol=a.rol,
                orden=a.orden,
                url=urls[a.ruta],
                ancho=a.ancho,
                alto=a.alto,
                seg=a.duracion_seg or 0,
                quien=a.quien,
            )
            for a in sorted(propios, key=lambda a: (a.orden, a.creado_a))
            if a.ruta in urls
        ],
    )


@router.put("/{token}", dependencies=[Depends(limitar("archivo"))])
def editar(token: str, datos: schemas.CartaCrear, db: Db) -> dict[str, bool]:
    """Cambia los textos. Las fotos y audios nuevos se suman con /api/cartas/{id}/archivos."""
    carta = por_admin(db, token)
    campos = campos_validados(datos, OCASIONES[carta.ocasion], abre_actual=carta.abre_desde)
    for clave, valor in campos.items():
        setattr(carta, clave, valor)
    db.commit()
    return {"ok": True}


@router.delete("/{token}/archivos/{archivo_id}", status_code=204)
def borrar_archivo(token: str, archivo_id: uuid.UUID, db: Db) -> None:
    """Saca una foto o un audio de quien la armó. Los de la familia se ocultan, no se borran."""
    carta = por_admin(db, token)
    archivo = db.get(Archivo, archivo_id)
    if not archivo or archivo.carta_id != carta.id or archivo.mensaje_id is not None:
        raise HTTPException(404, "No encontramos ese archivo.")
    get_almacen().borrar([archivo.ruta])
    db.delete(archivo)
    db.commit()
