"""Vista previa de WhatsApp (Open Graph).

La del link de ella la elige quien arma la carta, pero siempre entre estas frases fijas y
neutras: nunca nombres, fotos ni textos de la carta, y nada que avise que es un regalo.
"""

import html
import re

VISTAS_PREVIAS = {
    "sonido": "Abrilo con sonido 🔊",
    "para_vos": "Para vos",
    "mira": "Mirá esto 👀",
    "ratito": "Cuando tengas un ratito",
}
POR_DEFECTO = "sonido"


def imagen(clave: str) -> str:
    """Una imagen por frase (frontend/public/og-*.jpg): la frase sobre fondo bordó, sin pistas.

    Livianas a propósito: WhatsApp no muestra imágenes de más de unos 300 KB.
    """
    return f"/og-{clave if clave in VISTAS_PREVIAS else POR_DEFECTO}.jpg"


def _poner(pagina: str, atributo: str, nombre: str, valor: str) -> str:
    patron = re.compile(rf'(<meta {atributo}="{re.escape(nombre)}" content=")[^"]*(")')
    return patron.sub(lambda m: m.group(1) + html.escape(valor, quote=True) + m.group(2), pagina)


def con_vista_previa(pagina: str, clave: str, sitio: str) -> str:
    """La página de la carta con la frase elegida y su imagen."""
    titulo = VISTAS_PREVIAS.get(clave, VISTAS_PREVIAS[POR_DEFECTO])
    pagina = _poner(pagina, "property", "og:title", titulo)
    pagina = _poner(pagina, "property", "og:description", "")
    pagina = _poner(pagina, "name", "description", titulo)
    pagina = _poner(pagina, "property", "og:image", sitio + imagen(clave))
    return re.sub(r"<title>[^<]*</title>", f"<title>{html.escape(titulo)}</title>", pagina)
