"""Configuración por ocasión del lado del backend.

Sumar una ocasión es agregar su entrada acá (y su configuración y portada en el frontend),
sin tocar el motor de la carta.
"""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Ocasion:
    clave: str
    nombre: str
    activa: bool
    fecha: date | None = None
    # "días que sos mi mamá": solo tiene sentido en algunas ocasiones
    usa_contador: bool = False


OCASIONES: dict[str, Ocasion] = {
    "dia_madre": Ocasion(
        clave="dia_madre",
        nombre="Día de la Madre",
        activa=True,
        fecha=date(2026, 10, 18),
        usa_contador=True,
    ),
    "dia_padre": Ocasion(clave="dia_padre", nombre="Día del Padre", activa=False),
    "cumpleanos": Ocasion(clave="cumpleanos", nombre="Cumpleaños", activa=False),
    "aniversario": Ocasion(clave="aniversario", nombre="Aniversario", activa=False),
    "san_valentin": Ocasion(clave="san_valentin", nombre="San Valentín", activa=False),
    "navidad": Ocasion(clave="navidad", nombre="Navidad", activa=False),
    "egresados": Ocasion(clave="egresados", nombre="Egresados", activa=False),
    "porque_si": Ocasion(clave="porque_si", nombre="Porque sí", activa=False),
}


def ocasion_activa(clave: str) -> Ocasion | None:
    ocasion = OCASIONES.get(clave)
    return ocasion if ocasion and ocasion.activa else None
