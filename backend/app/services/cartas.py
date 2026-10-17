"""Lógica compartida de las cartas: buscar por token y armar el contenido que ve ella."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import schemas
from app.models import Archivo, Carta
from app.services.storage import get_almacen
from app.services.tokens import hash_token, token_coincide

NO_ENCONTRADA = "No encontramos esta carta. Revisá que el link esté completo."


def ahora() -> datetime:
    return datetime.now(UTC)


def _con_todo():
    return (
        selectinload(Carta.archivos),
        selectinload(Carta.mensajes),
        selectinload(Carta.lectura),
    )


def por_admin(db: Session, token: str) -> Carta:
    carta = db.scalar(
        select(Carta).where(Carta.token_admin_hash == hash_token(token)).options(*_con_todo())
    )
    if not carta or not token_coincide(token, carta.token_admin_hash):
        raise HTTPException(404, NO_ENCONTRADA)
    return carta


def por_admin_e_id(db: Session, carta_id: uuid.UUID, token: str | None) -> Carta:
    carta = db.get(Carta, carta_id)
    if not carta or not token or not token_coincide(token, carta.token_admin_hash):
        raise HTTPException(404, NO_ENCONTRADA)
    return carta


def por_familia(db: Session, token: str) -> Carta:
    carta = db.scalar(select(Carta).where(Carta.token_familia_hash == hash_token(token)))
    if not carta or not token_coincide(token, carta.token_familia_hash):
        raise HTTPException(404, NO_ENCONTRADA)
    return carta


def por_slug(db: Session, slug: str) -> Carta:
    carta = db.scalar(select(Carta).where(Carta.slug == slug).options(*_con_todo()))
    if not carta or carta.estado != "publicada":
        raise HTTPException(404, NO_ENCONTRADA)
    return carta


def en_espera(carta: Carta) -> bool:
    return carta.abre_desde is not None and carta.abre_desde > ahora()


def contenido(carta: Carta) -> schemas.Contenido:
    """Textos, links firmados de fotos y audios, y mensajes visibles de la familia."""
    listos = [a for a in carta.archivos if a.confirmado]
    visibles = {m.id for m in carta.mensajes if m.visible}
    listos = [a for a in listos if a.mensaje_id is None or a.mensaje_id in visibles]
    urls = get_almacen().firmar_lecturas([a.ruta for a in listos])

    def foto(a: Archivo) -> schemas.FotoPublica | None:
        url = urls.get(a.ruta)
        if not url:
            return None
        return schemas.FotoPublica(url=url, tipo=a.tipo, ancho=a.ancho, alto=a.alto)

    def audio(a: Archivo, quien: str) -> schemas.AudioPublico | None:
        url = urls.get(a.ruta)
        return schemas.AudioPublico(url=url, quien=quien, seg=a.duracion_seg or 0) if url else None

    fotos = schemas.FotosPublicas()
    audios: list[schemas.AudioPublico] = []
    for a in sorted(listos, key=lambda a: (a.orden, a.creado_a)):
        if a.mensaje_id is not None:
            continue
        if a.rol == "pila":
            if (f := foto(a)) and len(fotos.pila) < 6:
                fotos.pila.append(f)
        elif a.rol == "audio_autor":
            if au := audio(a, a.quien):
                audios.append(au)
        elif a.tipo == "foto":
            setattr(fotos, a.rol, foto(a))

    mensajes = []
    for m in carta.mensajes:
        if not m.visible:
            continue
        propios = [a for a in listos if a.mensaje_id == m.id]
        f = next((foto(a) for a in propios if a.tipo == "foto"), None)
        au = next((audio(a, m.nombre) for a in propios if a.tipo == "audio"), None)
        if not (m.texto or f or au):
            continue
        mensajes.append(
            schemas.MensajePublico(id=m.id, nombre=m.nombre, texto=m.texto, foto=f, audio=au)
        )

    cancion = (
        schemas.CancionPublica(tipo=carta.cancion_tipo, id=carta.cancion_id)
        if carta.cancion_tipo and carta.cancion_id
        else None
    )
    return schemas.Contenido(
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
        cancion=cancion,
        cancion_nombre=carta.cancion_nombre,
        regalo_titulo=carta.regalo_titulo,
        regalo_detalle=carta.regalo_detalle,
        fotos=fotos,
        audios=audios,
        mensajes=mensajes,
    )


def publica(carta: Carta, con_contenido: bool) -> schemas.CartaPublica:
    return schemas.CartaPublica(
        estado="abierta" if con_contenido else "espera",
        ocasion=carta.ocasion,
        para=carta.para,
        de=carta.de,
        estilo=carta.estilo,
        abre_desde=carta.abre_desde,
        ahora=ahora(),
        contenido=contenido(carta) if con_contenido else None,
    )
