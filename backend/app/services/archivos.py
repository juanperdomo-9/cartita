"""Reglas de los archivos: tipos, tamaños, cantidad por carta y revisión de los primeros bytes."""

from dataclasses import dataclass

MB = 1024 * 1024

MAX_FOTO = int(1.5 * MB)
MAX_AUDIO = 3 * MB
MAX_SEG_AUDIO = 90
MAX_VIDEO = 25 * MB
MAX_SEG_VIDEO = 60

MIMES_FOTO = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MIMES_AUDIO = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "video/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/opus": "ogg",
    "audio/webm": "webm",
    "video/webm": "webm",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/wave": "wav",
}

MIMES_VIDEO = {"video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm"}

ROLES_FOTO = {"principal", "p0", "p1", "p2", "antes", "ahora", "pila"}
ROLES_AUDIO = {"audio_autor"}

# Cuántos archivos admite cada lugar de la carta
LIMITE_POR_ROL = {
    "principal": 1,
    "p0": 1,
    "p1": 1,
    "p2": 1,
    "antes": 1,
    "ahora": 1,
    "pila": 6,
    "audio_autor": 4,
}
MAX_MENSAJES_FAMILIA = 30


class ArchivoInvalido(ValueError):
    pass


@dataclass(frozen=True)
class Pedido:
    tipo: str
    mime: str
    bytes: int
    duracion_seg: int | None


def mime_limpio(mime: str) -> str:
    """`audio/webm;codecs=opus` -> `audio/webm`."""
    return mime.split(";")[0].strip().lower()


def extension(tipo: str, mime: str) -> str:
    tabla = {"foto": MIMES_FOTO, "video": MIMES_VIDEO}.get(tipo, MIMES_AUDIO)
    return tabla[mime_limpio(mime)]


def validar_pedido(p: Pedido) -> None:
    """Antes de firmar la subida: tipo y tamaño."""
    mime = mime_limpio(p.mime)
    if p.bytes <= 0:
        raise ArchivoInvalido("El archivo está vacío.")
    if p.tipo == "foto":
        if mime not in MIMES_FOTO:
            raise ArchivoInvalido("Las fotos tienen que ser JPG, PNG o WEBP.")
        if p.bytes > MAX_FOTO:
            raise ArchivoInvalido("La foto pesa más de 1,5 MB.")
    elif p.tipo == "audio":
        if mime not in MIMES_AUDIO:
            raise ArchivoInvalido("Ese formato de audio no lo aceptamos.")
        if p.bytes > MAX_AUDIO:
            raise ArchivoInvalido("El audio pesa más de 3 MB.")
        if p.duracion_seg is not None and p.duracion_seg > MAX_SEG_AUDIO:
            raise ArchivoInvalido("El audio dura más de un minuto y medio.")
    elif p.tipo == "video":
        if mime not in MIMES_VIDEO:
            raise ArchivoInvalido("Los videos tienen que ser MP4, MOV o WEBM.")
        if p.bytes > MAX_VIDEO:
            raise ArchivoInvalido("El video pesa más de 25 MB.")
        if p.duracion_seg is not None and p.duracion_seg > MAX_SEG_VIDEO:
            raise ArchivoInvalido("El video dura más de un minuto.")
    else:
        raise ArchivoInvalido("Tipo de archivo desconocido.")


def _es_mp3(c: bytes) -> bool:
    return c[:3] == b"ID3" or (len(c) > 1 and c[0] == 0xFF and (c[1] & 0xE0) == 0xE0)


def contenido_valido(tipo: str, mime: str, cabeza: bytes) -> bool:
    """Al confirmar: los primeros bytes tienen que corresponder al tipo declarado."""
    mime = mime_limpio(mime)
    if tipo == "foto":
        return {
            "image/jpeg": cabeza[:3] == b"\xff\xd8\xff",
            "image/png": cabeza[:8] == b"\x89PNG\r\n\x1a\n",
            "image/webp": cabeza[:4] == b"RIFF" and cabeza[8:12] == b"WEBP",
        }.get(mime, False)
    if tipo == "video":
        if mime == "video/webm":
            return cabeza[:4] == b"\x1a\x45\xdf\xa3"
        # MP4 y MOV (QuickTime): empiezan con una caja ftyp, moov, wide, free o mdat
        return cabeza[4:8] in (b"ftyp", b"moov", b"wide", b"free", b"mdat")
    ext = MIMES_AUDIO.get(mime)
    if ext in ("mp3", "aac"):
        return _es_mp3(cabeza)
    if ext == "m4a":
        return cabeza[4:8] == b"ftyp"
    if ext == "ogg":
        return cabeza[:4] == b"OggS"
    if ext == "webm":
        return cabeza[:4] == b"\x1a\x45\xdf\xa3"
    if ext == "wav":
        return cabeza[:4] == b"RIFF" and cabeza[8:12] == b"WAVE"
    return False
