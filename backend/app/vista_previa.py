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

# Imagen abstracta, sin sobre ni nada que dé pistas
IMAGEN_NEUTRA = "/og-neutra.png"


def _poner(pagina: str, atributo: str, nombre: str, valor: str) -> str:
    patron = re.compile(rf'(<meta {atributo}="{re.escape(nombre)}" content=")[^"]*(")')
    return patron.sub(lambda m: m.group(1) + html.escape(valor, quote=True) + m.group(2), pagina)


def con_vista_previa(pagina: str, clave: str, sitio: str) -> str:
    """La página de la carta con la frase elegida y la imagen neutra."""
    titulo = VISTAS_PREVIAS.get(clave, VISTAS_PREVIAS[POR_DEFECTO])
    pagina = _poner(pagina, "property", "og:title", titulo)
    pagina = _poner(pagina, "property", "og:description", "")
    pagina = _poner(pagina, "name", "description", titulo)
    pagina = _poner(pagina, "property", "og:image", sitio + IMAGEN_NEUTRA)
    return re.sub(r"<title>[^<]*</title>", f"<title>{html.escape(titulo)}</title>", pagina)
