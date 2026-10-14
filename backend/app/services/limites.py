"""Límites por IP (ventana deslizante en memoria).

Alcanza para un solo proceso (el plan free de Render corre uno). Si algún día hay varias
instancias, esto tiene que pasar a la base o a Redis.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

HORA = 3600

# clave -> (cantidad, segundos)
REGLAS = {
    "crear_carta": (20, HORA),
    "mensaje_familia": (30, HORA),
    "archivo": (200, HORA),
    "evento": (300, HORA),
}

_lock = threading.Lock()
_historial: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def ip_de(request: Request) -> str:
    # Render agrega la IP real al final de X-Forwarded-For. La de más a la derecha es la que
    # vio su proxy; las de la izquierda las puede inventar el cliente.
    reenviada = request.headers.get("x-forwarded-for", "")
    if reenviada:
        return reenviada.split(",")[-1].strip()
    return request.client.host if request.client else "desconocida"


def permitir(clave: str, ip: str) -> bool:
    cantidad, ventana = REGLAS[clave]
    ahora = time.monotonic()
    with _lock:
        cola = _historial[(clave, ip)]
        while cola and cola[0] <= ahora - ventana:
            cola.popleft()
        if len(cola) >= cantidad:
            return False
        cola.append(ahora)
        return True


def limitar(clave: str):
    """Dependencia de FastAPI: corta con 429 si la IP se pasó del límite."""

    def dependencia(request: Request) -> None:
        if not permitir(clave, ip_de(request)):
            raise HTTPException(429, "Demasiados intentos. Probá de nuevo en un rato.")

    return dependencia


def reiniciar() -> None:
    with _lock:
        _historial.clear()
