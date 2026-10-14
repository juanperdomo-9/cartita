"""Armar y publicar: crear la carta, pedir links de subida, confirmar archivos y publicar."""

import uuid
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import schemas
from app.db import get_db
from app.models import Archivo, Carta, MensajeFamilia
from app.ocasiones import ocasion_activa
from app.services import archivos as reglas
from app.services.cancion import CancionInvalida, leer_cancion
from app.services.cartas import ahora, por_admin_e_id
from app.services.limites import limitar
from app.services.storage import get_almacen
from app.services.tokens import (
    cifrar_familia,
    hash_token,
    nuevo_slug,
    nuevo_token,
    token_coincide,
)

router = APIRouter(prefix="/api", tags=["cartas"])

Db = Annotated[Session, Depends(get_db)]
TokenAdmin = Annotated[str | None, Header(alias="X-Token-Admin")]
TokenFamilia = Annotated[str | None, Header(alias="X-Token-Familia")]


@router.post("/cartas", status_code=201, dependencies=[Depends(limitar("crear_carta"))])
def crear_carta(datos: schemas.CartaCrear, db: Db) -> schemas.CartaCreada:
    ocasion = ocasion_activa(datos.ocasion)
    if not ocasion:
        raise HTTPException(422, "Esa ocasión todavía no está disponible.")
    try:
        cancion = leer_cancion(datos.cancion or "")
    except CancionInvalida as e:
        raise HTTPException(422, str(e)) from e
    if datos.abre_desde is not None:
        if datos.abre_desde <= ahora():
            raise HTTPException(422, "Esa fecha de apertura ya pasó.")
        if datos.abre_desde > ahora() + timedelta(days=366):
            raise HTTPException(422, "La fecha de apertura está demasiado lejos.")
    desde = datos.desde if ocasion.usa_contador else None
    if desde is not None and desde > ahora().date():
        raise HTTPException(422, "Esa fecha todavía no llegó.")

    token_familia, token_admin = nuevo_token(), nuevo_token()
    carta = Carta(
        slug=nuevo_slug(),
        token_familia_hash=hash_token(token_familia),
        token_admin_hash=hash_token(token_admin),
        token_familia_cifrado=cifrar_familia(token_familia, token_admin),
        ocasion=ocasion.clave,
        estado="borrador",
        plan="gratis",
        para=datos.para,
        de=datos.de,
        desde=desde,
        titulo=datos.titulo,
        subtitulo=datos.subtitulo,
        carta=datos.carta,
        lugar=datos.lugar,
        recuerdo=datos.recuerdo,
        polas=(datos.polas + ["", "", ""])[:3],
        antes_txt=datos.antes_txt,
        ahora_txt=datos.ahora_txt,
        gracias=datos.gracias,
        cancion_tipo=cancion.tipo if cancion else None,
        cancion_id=cancion.id if cancion else None,
        cancion_nombre=datos.cancion_nombre,
        regalo_titulo=datos.regalo_titulo,
        regalo_detalle=datos.regalo_detalle,
        estilo=datos.estilo,
        abre_desde=datos.abre_desde,
    )
    db.add(carta)
    db.commit()
    return schemas.CartaCreada(
        id=carta.id, slug=carta.slug, token_familia=token_familia, token_admin=token_admin
    )


def nuevo_archivo(
    db: Session,
    carta: Carta,
    pedido: schemas.PedidoArchivo,
    rol: str,
    *,
    mensaje: MensajeFamilia | None = None,
    quien: str = "",
    orden: int = 0,
) -> schemas.ArchivoFirmado:
    """Valida tipo, tamaño y cantidad, registra el archivo y firma la subida."""
    try:
        reglas.validar_pedido(
            reglas.Pedido(pedido.tipo, pedido.mime, pedido.bytes, pedido.duracion_seg)
        )
    except reglas.ArchivoInvalido as e:
        raise HTTPException(422, str(e)) from e

    if mensaje is not None:
        ya = db.scalar(
            select(func.count())
            .select_from(Archivo)
            .where(Archivo.mensaje_id == mensaje.id, Archivo.tipo == pedido.tipo)
        )
        if ya:
            raise HTTPException(422, "Cada mensaje lleva una foto y un audio como máximo.")
    else:
        esperado = "audio" if rol in reglas.ROLES_AUDIO else "foto"
        if pedido.tipo != esperado:
            raise HTTPException(422, "Ese archivo no va en ese lugar de la carta.")
        ya = db.scalar(
            select(func.count())
            .select_from(Archivo)
            .where(Archivo.carta_id == carta.id, Archivo.rol == rol)
        )
        if ya >= reglas.LIMITE_POR_ROL[rol]:
            raise HTTPException(422, "Ya llegaste al máximo de archivos para esa parte.")

    archivo_id = uuid.uuid4()
    ruta = f"{carta.id}/{archivo_id}.{reglas.extension(pedido.tipo, pedido.mime)}"
    archivo = Archivo(
        id=archivo_id,
        carta_id=carta.id,
        mensaje_id=mensaje.id if mensaje else None,
        tipo=pedido.tipo,
        rol=rol,
        orden=orden,
        ruta=ruta,
        mime=reglas.mime_limpio(pedido.mime),
        bytes=pedido.bytes,
        ancho=pedido.ancho,
        alto=pedido.alto,
        duracion_seg=pedido.duracion_seg,
        quien=quien,
    )
    db.add(archivo)
    db.commit()
    subida = get_almacen().firmar_subida(ruta, archivo.mime)
    return schemas.ArchivoFirmado(
        id=archivo.id,
        subida=schemas.SubidaFirmada(url=subida.url, metodo=subida.metodo, headers=subida.headers),
    )


@router.post(
    "/cartas/{carta_id}/archivos", status_code=201, dependencies=[Depends(limitar("archivo"))]
)
def pedir_subida(
    carta_id: uuid.UUID, pedido: schemas.PedidoArchivoCarta, db: Db, token: TokenAdmin = None
) -> schemas.ArchivoFirmado:
    carta = por_admin_e_id(db, carta_id, token)
    quien = pedido.quien if pedido.tipo == "audio" else ""
    return nuevo_archivo(db, carta, pedido, pedido.rol, quien=quien, orden=pedido.orden)


@router.post("/archivos/{archivo_id}/confirmar")
def confirmar_archivo(
    archivo_id: uuid.UUID,
    db: Db,
    token_admin: TokenAdmin = None,
    token_familia: TokenFamilia = None,
) -> dict[str, bool]:
    """Revisa que el archivo haya llegado, su tamaño y sus primeros bytes."""
    archivo = db.get(Archivo, archivo_id)
    carta = archivo.carta if archivo else None
    autorizado = carta is not None and (
        (token_admin and token_coincide(token_admin, carta.token_admin_hash))
        or (
            token_familia
            and archivo.mensaje_id is not None
            and token_coincide(token_familia, carta.token_familia_hash)
        )
    )
    if not autorizado:
        raise HTTPException(404, "No encontramos ese archivo.")
    if archivo.confirmado:
        return {"confirmado": True}

    almacen = get_almacen()
    datos = almacen.leer(archivo.ruta)
    if datos is None:
        raise HTTPException(409, "El archivo todavía no se subió.")
    maximo = reglas.MAX_FOTO if archivo.tipo == "foto" else reglas.MAX_AUDIO
    if len(datos) > maximo or not reglas.contenido_valido(archivo.tipo, archivo.mime, datos[:16]):
        almacen.borrar([archivo.ruta])
        db.delete(archivo)
        db.commit()
        raise HTTPException(422, "Ese archivo no es válido o pesa demasiado.")
    archivo.bytes = len(datos)
    archivo.confirmado = True
    db.commit()
    return {"confirmado": True}


@router.post("/cartas/{carta_id}/publicar")
def publicar(carta_id: uuid.UUID, db: Db, token: TokenAdmin = None) -> dict[str, str]:
    carta = por_admin_e_id(db, carta_id, token)
    if carta.estado == "borrador":
        # Etapa 2: con PAGOS_ACTIVOS y plan pago, acá pasa a `pendiente_pago`.
        carta.estado = "publicada"
        db.commit()
    return {"estado": carta.estado}
