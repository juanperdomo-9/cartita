"""Almacenamiento de fotos y audios.

En producción: Supabase Storage, bucket privado. El frontend nunca escribe con permisos propios:
el backend le da un link firmado de subida y, para leer, links firmados que duran unas horas.
Endpoints verificados contra storage-js (StorageFileApi): `object/upload/sign`, `object/sign`,
`object/{bucket}/{ruta}` y `DELETE object/{bucket}`.

En desarrollo (sin SUPABASE_URL): los archivos van a una carpeta local y los links se firman
con HMAC; los sirve `routers/almacen.py`. Así todo el flujo se prueba sin el proyecto real.
"""

import hashlib
import hmac
import time
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Protocol
from urllib.parse import quote

import httpx

from app.config import Settings, get_settings

DURACION_LECTURA = 6 * 3600  # los links para ver fotos y audios duran 6 horas
DURACION_SUBIDA = 2 * 3600


@dataclass(frozen=True)
class Subida:
    url: str
    metodo: str = "PUT"
    headers: dict[str, str] = field(default_factory=dict)


class Almacen(Protocol):
    def firmar_subida(self, ruta: str, mime: str) -> Subida: ...
    def firmar_lecturas(self, rutas: list[str]) -> dict[str, str]: ...
    def inicio(self, ruta: str) -> tuple[bytes, int] | None: ...
    def borrar(self, rutas: list[str]) -> None: ...


class AlmacenSupabase:
    def __init__(self, settings: Settings) -> None:
        self.base = settings.supabase_url + "/storage/v1"
        self.bucket = settings.storage_bucket
        clave = settings.supabase_service_role_key.get_secret_value()
        # Las claves nuevas (sb_secret_...) no son JWT: van solo en `apikey`.
        self.headers = {"apikey": clave}
        if not clave.startswith("sb_secret_"):
            self.headers["Authorization"] = f"Bearer {clave}"
        self.cliente = httpx.Client(timeout=httpx.Timeout(20, connect=10), headers=self.headers)

    def _ruta(self, ruta: str) -> str:
        return f"{self.bucket}/{quote(ruta)}"

    def firmar_subida(self, ruta: str, mime: str) -> Subida:
        r = self.cliente.post(f"{self.base}/object/upload/sign/{self._ruta(ruta)}", json={})
        r.raise_for_status()
        return Subida(url=self.base + r.json()["url"], headers={"content-type": mime})

    def firmar_lecturas(self, rutas: list[str]) -> dict[str, str]:
        if not rutas:
            return {}
        r = self.cliente.post(
            f"{self.base}/object/sign/{self.bucket}",
            json={"expiresIn": DURACION_LECTURA, "paths": rutas},
        )
        r.raise_for_status()
        return {
            d["path"]: self.base + d["signedURL"]
            for d in r.json()
            if d.get("signedURL") and not d.get("error")
        }

    def inicio(self, ruta: str) -> tuple[bytes, int] | None:
        """Los primeros bytes y el tamaño total, sin bajar el archivo entero."""
        r = self.cliente.get(
            f"{self.base}/object/{self._ruta(ruta)}", headers={"Range": "bytes=0-31"}
        )
        if r.status_code in (400, 404, 416):
            return None
        r.raise_for_status()
        total = r.headers.get("content-range", "").rpartition("/")[2]
        if r.status_code == 206 and total.isdigit():
            return r.content[:32], int(total)
        return r.content[:32], len(r.content)

    def borrar(self, rutas: list[str]) -> None:
        if rutas:
            self.cliente.request(
                "DELETE", f"{self.base}/object/{self.bucket}", json={"prefixes": rutas}
            )


class AlmacenLocal:
    """Solo desarrollo y tests: carpeta en disco con links firmados por HMAC."""

    def __init__(self, settings: Settings) -> None:
        self.carpeta = Path(settings.almacen_local).resolve()
        self.base = settings.app_base_url + "/api/almacen"
        self.secreto = settings.pepper.encode()

    def firma(self, accion: str, ruta: str, vence: int) -> str:
        msg = f"{accion}:{ruta}:{vence}".encode()
        return hmac.new(self.secreto, msg, hashlib.sha256).hexdigest()

    def firma_valida(self, accion: str, ruta: str, vence: int, firma: str) -> bool:
        return vence >= time.time() and hmac.compare_digest(self.firma(accion, ruta, vence), firma)

    def archivo(self, ruta: str) -> Path:
        destino = (self.carpeta / ruta).resolve()
        if self.carpeta not in destino.parents:
            raise ValueError("ruta inválida")
        return destino

    def _url(self, accion: str, ruta: str, duracion: int) -> str:
        vence = int(time.time()) + duracion
        firma = self.firma(accion, ruta, vence)
        return f"{self.base}/{accion}/{quote(ruta)}?vence={vence}&firma={firma}"

    def firmar_subida(self, ruta: str, mime: str) -> Subida:
        return Subida(url=self._url("subir", ruta, DURACION_SUBIDA), headers={"content-type": mime})

    def firmar_lecturas(self, rutas: list[str]) -> dict[str, str]:
        return {ruta: self._url("ver", ruta, DURACION_LECTURA) for ruta in rutas}

    def inicio(self, ruta: str) -> tuple[bytes, int] | None:
        destino = self.archivo(ruta)
        if not destino.exists():
            return None
        with destino.open("rb") as f:
            return f.read(32), destino.stat().st_size

    def borrar(self, rutas: list[str]) -> None:
        for ruta in rutas:
            self.archivo(ruta).unlink(missing_ok=True)


@lru_cache
def get_almacen() -> Almacen:
    settings = get_settings()
    return AlmacenSupabase(settings) if settings.usa_supabase else AlmacenLocal(settings)
