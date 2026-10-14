import { diaMadre } from './diaMadre'
import type { ClaveOcasion, Ocasion, OcasionActiva, OcasionProxima } from './tipos'

export type { ClaveOcasion, Ocasion, OcasionActiva, Voces } from './tipos'

const proxima = (
  clave: ClaveOcasion,
  nombre: string,
  ruta: string,
  color: string,
  sello: string,
  emoji: string,
  giro: string,
  fecha: string,
): OcasionProxima => ({ clave, nombre, ruta, activa: false, tarjeta: { color, sello, emoji, giro, fecha } })

// Orden del Inicio. Las que no están listas salen como "Próximamente".
export const OCASIONES: Ocasion[] = [
  diaMadre,
  proxima('dia_padre', 'Día del Padre', '/dia-del-padre', '#cfdcf0', '#2f5aa8', '👔', '2deg', 'jun'),
  proxima('cumpleanos', 'Cumpleaños', '/cumpleanos', '#f7e2a3', '#e2552d', '🎂', '-1deg', 'todo el año'),
  proxima('aniversario', 'Aniversario', '/aniversario', '#e1d4f2', '#7a4fc2', '💍', '3deg', 'cuando toque'),
  proxima('san_valentin', 'San Valentín', '/san-valentin', '#f5c6c0', '#cf3f45', '💌', '-3deg', '14 feb'),
  proxima('navidad', 'Navidad', '/navidad', '#cfe6d2', '#2f7a46', '🎄', '1deg', '24 dic'),
  proxima('egresados', 'Egresados', '/egresados', '#ead8b7', '#1f3b2d', '🎓', '-2deg', 'fin de año'),
  proxima('porque_si', 'Porque sí', '/porque-si', '#cdeee6', '#1d8f7a', '✨', '2deg', 'cualquier día'),
]

export function ocasionActiva(clave: string): OcasionActiva {
  const o = OCASIONES.find((x) => x.clave === clave)
  return o && o.activa ? o : diaMadre
}

export function ocasionPorRuta(ruta: string): OcasionActiva | null {
  const o = OCASIONES.find((x) => x.ruta === ruta)
  return o && o.activa ? o : null
}
