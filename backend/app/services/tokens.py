"""Slugs y tokens de las cartas.

- slug: 10 letras y números, va tal cual en la base (es el link de ella).
- token_familia y token_admin: `secrets.token_urlsafe(24)`. En la base solo queda su hash
  (SHA-256 con TOKEN_PEPPER) y se comparan en tiempo constante.
- El token de la familia además se guarda cifrado con una clave que sale del token de admin,
  para que el seguimiento pueda volver a dar el link de la familia.
"""

import hashlib
import hmac
import secrets
import string

from app.config import get_settings

ALFABETO_SLUG = string.ascii_letters + string.digits
LARGO_SLUG = 10


def nuevo_slug() -> str:
    return "".join(secrets.choice(ALFABETO_SLUG) for _ in range(LARGO_SLUG))


def nuevo_token() -> str:
    return secrets.token_urlsafe(24)


def hash_token(token: str) -> str:
    pepper = get_settings().pepper.encode()
    return hmac.new(pepper, token.encode(), hashlib.sha256).hexdigest()


def token_coincide(token: str, hash_guardado: str) -> bool:
    return hmac.compare_digest(hash_token(token), hash_guardado)


def _clave_familia(token_admin: str, largo: int) -> bytes:
    pepper = get_settings().pepper.encode()
    clave = hmac.new(pepper, b"familia:" + token_admin.encode(), hashlib.sha256).digest()
    if largo > len(clave):
        raise ValueError("token demasiado largo")
    return clave[:largo]


def cifrar_familia(token_familia: str, token_admin: str) -> bytes:
    datos = token_familia.encode()
    clave = _clave_familia(token_admin, len(datos))
    return bytes(a ^ b for a, b in zip(datos, clave, strict=True))


def descifrar_familia(cifrado: bytes, token_admin: str) -> str:
    clave = _clave_familia(token_admin, len(cifrado))
    return bytes(a ^ b for a, b in zip(cifrado, clave, strict=True)).decode()
