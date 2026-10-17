import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

PK_UUID = {"primary_key": True, "server_default": text("gen_random_uuid()")}


def _ahora():
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Carta(Base):
    __tablename__ = "cartas"
    __table_args__ = (
        CheckConstraint("estado IN ('borrador', 'publicada', 'pendiente_pago')", name="estado"),
        CheckConstraint("plan IN ('gratis', 'premium')", name="plan"),
        CheckConstraint("estilo IN ('papel', 'bordo')", name="estilo"),
        CheckConstraint(
            "cancion_tipo IS NULL OR cancion_tipo IN ('youtube', 'spotify')", name="cancion_tipo"
        ),
        CheckConstraint(
            "vista_previa IN ('sonido', 'para_vos', 'mira', 'ratito')", name="vista_previa"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **PK_UUID)
    slug: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    token_familia_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    token_admin_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    # El token de la familia cifrado con una clave que sale del token de admin: así el
    # seguimiento puede volver a mostrar el link de la familia sin guardarlo en claro.
    token_familia_cifrado: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    ocasion: Mapped[str] = mapped_column(String(30), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, server_default="borrador")
    plan: Mapped[str] = mapped_column(String(20), nullable=False, server_default="gratis")

    para: Mapped[str] = mapped_column(String(20), nullable=False)
    de: Mapped[str] = mapped_column(String(50), nullable=False)
    desde: Mapped[date | None] = mapped_column(Date)
    titulo: Mapped[str] = mapped_column(String(70), nullable=False, server_default="")
    subtitulo: Mapped[str] = mapped_column(String(60), nullable=False, server_default="")
    carta: Mapped[str] = mapped_column(String(2000), nullable=False, server_default="")
    lugar: Mapped[str] = mapped_column(String(40), nullable=False, server_default="")
    recuerdo: Mapped[str] = mapped_column(String(90), nullable=False, server_default="")
    polas: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    antes_txt: Mapped[str] = mapped_column(String(16), nullable=False, server_default="")
    ahora_txt: Mapped[str] = mapped_column(String(16), nullable=False, server_default="")
    gracias: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    cancion_tipo: Mapped[str | None] = mapped_column(String(10))
    cancion_id: Mapped[str | None] = mapped_column(String(40))
    cancion_nombre: Mapped[str] = mapped_column(String(50), nullable=False, server_default="")
    regalo_titulo: Mapped[str] = mapped_column(String(36), nullable=False, server_default="")
    regalo_detalle: Mapped[str] = mapped_column(String(50), nullable=False, server_default="")
    estilo: Mapped[str] = mapped_column(String(10), nullable=False, server_default="papel")
    # Frase de la vista previa de WhatsApp (ver app/vista_previa.py)
    vista_previa: Mapped[str] = mapped_column(String(20), nullable=False, server_default="sonido")
    # null = se puede abrir apenas le llegue
    abre_desde: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    creada_a: Mapped[datetime] = _ahora()
    actualizada_a: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    archivos: Mapped[list["Archivo"]] = relationship(
        back_populates="carta", cascade="all, delete-orphan", order_by="Archivo.orden"
    )
    mensajes: Mapped[list["MensajeFamilia"]] = relationship(
        back_populates="carta", cascade="all, delete-orphan", order_by="MensajeFamilia.creado_a"
    )
    lectura: Mapped["Lectura | None"] = relationship(
        back_populates="carta", cascade="all, delete-orphan"
    )


class MensajeFamilia(Base):
    __tablename__ = "mensajes_familia"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **PK_UUID)
    carta_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cartas.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nombre: Mapped[str] = mapped_column(String(40), nullable=False)
    texto: Mapped[str] = mapped_column(String(300), nullable=False, server_default="")
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    creado_a: Mapped[datetime] = _ahora()

    carta: Mapped[Carta] = relationship(back_populates="mensajes")
    archivos: Mapped[list["Archivo"]] = relationship(back_populates="mensaje")


class Archivo(Base):
    __tablename__ = "archivos"
    __table_args__ = (
        CheckConstraint("tipo IN ('foto', 'audio')", name="tipo"),
        CheckConstraint(
            "rol IN ('principal', 'p0', 'p1', 'p2', 'antes', 'ahora', 'pila', 'audio_autor',"
            " 'familia')",
            name="rol",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **PK_UUID)
    carta_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cartas.id", ondelete="CASCADE"), index=True, nullable=False
    )
    mensaje_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("mensajes_familia.id", ondelete="CASCADE"), index=True
    )
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    ruta: Mapped[str] = mapped_column(Text, nullable=False)
    mime: Mapped[str] = mapped_column(String(60), nullable=False)
    bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    ancho: Mapped[int | None] = mapped_column(Integer)
    alto: Mapped[int | None] = mapped_column(Integer)
    duracion_seg: Mapped[int | None] = mapped_column(Integer)
    quien: Mapped[str] = mapped_column(String(30), nullable=False, server_default="")
    confirmado: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    creado_a: Mapped[datetime] = _ahora()

    carta: Mapped[Carta] = relationship(back_populates="archivos")
    mensaje: Mapped[MensajeFamilia | None] = relationship(back_populates="archivos")


class Lectura(Base):
    __tablename__ = "lecturas"

    carta_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cartas.id", ondelete="CASCADE"), primary_key=True
    )
    visto_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    abierta_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    abrazos: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    respuesta: Mapped[str | None] = mapped_column(String(400))
    respuesta_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    carta: Mapped[Carta] = relationship(back_populates="lectura")
