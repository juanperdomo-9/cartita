"""Esquemas de Pydantic: lo que entra y sale de la API.

Los largos máximos de los textos se validan acá: si el frontend manda de más, se rechaza.
"""

import uuid
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator


def Texto(maximo: int, minimo: int = 0):  # noqa: N802 (se usa como tipo)
    return Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=minimo, max_length=maximo)
    ]


Estilo = Literal["papel", "bordo"]
VistaPrevia = Literal["sonido", "para_vos", "mira", "ratito"]
Rol = Literal["principal", "p0", "p1", "p2", "antes", "ahora", "pila", "audio_autor"]
TipoArchivo = Literal["foto", "audio"]


# ---------- Crear la carta ----------
class CartaCrear(BaseModel):
    ocasion: str = "dia_madre"
    para: Texto(20, 1)
    de: Texto(50, 1)
    desde: date | None = None
    titulo: Texto(70) = ""
    subtitulo: Texto(60) = ""
    carta: Texto(700) = ""
    lugar: Texto(40) = ""
    recuerdo: Texto(90) = ""
    polas: list[Texto(20)] = Field(default_factory=list, max_length=3)
    antes_txt: Texto(16) = ""
    ahora_txt: Texto(16) = ""
    gracias: list[Texto(60)] = Field(default_factory=list, max_length=6)
    cancion: Texto(300) | None = None
    cancion_nombre: Texto(50) = ""
    regalo_titulo: Texto(36) = ""
    regalo_detalle: Texto(50) = ""
    estilo: Estilo = "papel"
    vista_previa: VistaPrevia = "sonido"
    abre_desde: datetime | None = None

    @field_validator("gracias")
    @classmethod
    def sin_vacias(cls, valor: list[str]) -> list[str]:
        return [g for g in valor if g]

    @field_validator("abre_desde")
    @classmethod
    def con_zona(cls, valor: datetime | None) -> datetime | None:
        if valor is not None and valor.tzinfo is None:
            raise ValueError("La fecha de apertura tiene que tener zona horaria.")
        return valor


class CartaCreada(BaseModel):
    id: uuid.UUID
    slug: str
    token_familia: str
    token_admin: str


# ---------- Archivos ----------
class PedidoArchivo(BaseModel):
    tipo: TipoArchivo
    mime: Texto(80, 3)
    bytes: int = Field(gt=0)
    ancho: int | None = Field(default=None, ge=1, le=20000)
    alto: int | None = Field(default=None, ge=1, le=20000)
    duracion_seg: int | None = Field(default=None, ge=0, le=3600)


class PedidoArchivoCarta(PedidoArchivo):
    rol: Rol
    orden: int = Field(default=0, ge=0, le=20)
    quien: Texto(30) = ""


class SubidaFirmada(BaseModel):
    url: str
    metodo: str
    headers: dict[str, str]


class ArchivoFirmado(BaseModel):
    id: uuid.UUID
    subida: SubidaFirmada


# ---------- La carta para ella ----------
class FotoPublica(BaseModel):
    url: str
    ancho: int | None = None
    alto: int | None = None


class AudioPublico(BaseModel):
    url: str
    quien: str
    seg: int


class MensajePublico(BaseModel):
    id: uuid.UUID
    nombre: str
    texto: str
    foto: FotoPublica | None = None
    audio: AudioPublico | None = None


class CancionPublica(BaseModel):
    tipo: Literal["youtube", "spotify"]
    id: str


class FotosPublicas(BaseModel):
    principal: FotoPublica | None = None
    p0: FotoPublica | None = None
    p1: FotoPublica | None = None
    p2: FotoPublica | None = None
    antes: FotoPublica | None = None
    ahora: FotoPublica | None = None
    pila: list[FotoPublica] = Field(default_factory=list)


class Contenido(BaseModel):
    desde: date | None
    titulo: str
    subtitulo: str
    carta: str
    lugar: str
    recuerdo: str
    polas: list[str]
    antes_txt: str
    ahora_txt: str
    gracias: list[str]
    cancion: CancionPublica | None
    cancion_nombre: str
    regalo_titulo: str
    regalo_detalle: str
    fotos: FotosPublicas
    audios: list[AudioPublico]
    mensajes: list[MensajePublico]


class CartaPublica(BaseModel):
    """Antes de `abre_desde` va sin `contenido`: solo lo necesario para la cuenta regresiva."""

    estado: Literal["espera", "abierta"]
    ocasion: str
    para: str
    de: str
    estilo: Estilo
    abre_desde: datetime | None
    ahora: datetime
    contenido: Contenido | None = None


class Evento(BaseModel):
    tipo: Literal["visto", "abierta", "abrazos", "respuesta"]
    cantidad: int = Field(default=1, ge=1, le=100)
    texto: Texto(400) = ""


# ---------- Familia ----------
class CartaParaFamilia(BaseModel):
    ocasion: str
    para: str
    de: str


class MensajeCrear(BaseModel):
    nombre: Texto(40, 1)
    texto: Texto(300) = ""


class MensajeCreado(BaseModel):
    id: uuid.UUID


# ---------- Seguimiento ----------
class LecturaSeguimiento(BaseModel):
    visto_a: datetime | None = None
    abierta_a: datetime | None = None
    abrazos: int = 0
    respuesta: str | None = None
    respuesta_a: datetime | None = None


class MensajeSeguimiento(BaseModel):
    id: uuid.UUID
    nombre: str
    texto: str
    visible: bool
    con_foto: bool
    con_audio: bool
    creado_a: datetime


class Seguimiento(BaseModel):
    id: uuid.UUID
    slug: str
    token_familia: str
    ocasion: str
    estado: str
    para: str
    de: str
    abre_desde: datetime | None
    creada_a: datetime
    ahora: datetime
    lectura: LecturaSeguimiento
    mensajes: list[MensajeSeguimiento]


class CambioMensaje(BaseModel):
    visible: bool


# ---------- Editar ----------
class ArchivoGuardado(BaseModel):
    id: uuid.UUID
    tipo: TipoArchivo
    rol: str
    orden: int
    url: str
    ancho: int | None
    alto: int | None
    seg: int
    quien: str


class CartaParaEditar(BaseModel):
    id: uuid.UUID
    datos: CartaCrear
    archivos: list[ArchivoGuardado]
