"""Link de la canción: solo videos de YouTube (no listas). Spotify se sacó el 17/10: sin sesión
suena solo 30 segundos y su reproductor no deja bajarle el volumen.

Mismo criterio que `leerCancion()` del prototipo. Se guarda como tipo + id.
"""

import re
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse

ID_YOUTUBE = re.compile(r"^[\w-]{11}$")
RUTA_YOUTUBE = re.compile(r"^/(shorts|embed|live)/([^/?#]+)")


class CancionInvalida(ValueError):
    pass


@dataclass(frozen=True)
class Cancion:
    tipo: str
    id: str


def leer_cancion(link: str) -> Cancion | None:
    texto = (link or "").strip()
    if not texto:
        return None
    if not re.match(r"^https?://", texto, re.IGNORECASE):
        texto = "https://" + texto
    try:
        url = urlparse(texto)
    except ValueError as e:
        raise CancionInvalida("Ese link no parece de YouTube.") from e

    host = re.sub(r"^(www|m)\.", "", (url.hostname or "").lower())
    video = None
    if host == "youtu.be":
        video = url.path.lstrip("/").split("/")[0]
    elif host in ("youtube.com", "music.youtube.com"):
        if url.path == "/watch":
            video = (parse_qs(url.query).get("v") or [None])[0]
        elif m := RUTA_YOUTUBE.match(url.path):
            video = m.group(2)
    if video and ID_YOUTUBE.match(video):
        return Cancion("youtube", video)

    if host in ("open.spotify.com", "spotify.link"):
        raise CancionInvalida(
            "Por ahora solo usamos canciones de YouTube. Buscá el tema ahí y pegá ese link."
        )
    raise CancionInvalida("Ese link no parece de una canción de YouTube.")
