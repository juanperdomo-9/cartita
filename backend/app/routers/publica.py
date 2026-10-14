"""Lo que usa ella: ver la carta (`/c/{slug}`) y registrar visto, abierta, abrazos y respuesta."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app import schemas
from app.db import get_db
from app.models import Lectura
from app.services.cartas import en_espera, por_slug, publica
from app.services.limites import limitar

router = APIRouter(prefix="/api/c", tags=["ella"])

Db = Annotated[Session, Depends(get_db)]
MAX_ABRAZOS = 10_000


@router.get("/{slug}")
def ver_carta(slug: str, db: Db) -> schemas.CartaPublica:
    carta = por_slug(db, slug)
    # Antes de `abre_desde` no sale nada del contenido: solo para quién, de quién y cuándo.
    return publica(carta, con_contenido=not en_espera(carta))


@router.post("/{slug}/eventos", status_code=204, dependencies=[Depends(limitar("evento"))])
def registrar_evento(slug: str, evento: schemas.Evento, db: Db) -> None:
    carta = por_slug(db, slug)
    if evento.tipo != "visto" and en_espera(carta):
        raise HTTPException(409, "Todavía no se puede abrir.")
    if evento.tipo == "respuesta" and not evento.texto:
        raise HTTPException(422, "La respuesta está vacía.")

    db.execute(insert(Lectura).values(carta_id=carta.id).on_conflict_do_nothing())
    donde = Lectura.carta_id == carta.id
    cambios = {
        # visto_a y abierta_a se guardan solo la primera vez
        "visto": {"visto_a": func.coalesce(Lectura.visto_a, func.now())},
        "abierta": {
            "visto_a": func.coalesce(Lectura.visto_a, func.now()),
            "abierta_a": func.coalesce(Lectura.abierta_a, func.now()),
        },
        "abrazos": {"abrazos": func.least(Lectura.abrazos + evento.cantidad, MAX_ABRAZOS)},
        "respuesta": {"respuesta": evento.texto, "respuesta_a": func.now()},
    }[evento.tipo]
    db.execute(update(Lectura).where(donde).values(**cambios))
    db.commit()
