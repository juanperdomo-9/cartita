// Frases para la vista previa de WhatsApp del link de ella. Las mismas que el backend
// (backend/app/vista_previa.py): neutras, sin nombres ni nada que avise que es un regalo.
export const VISTAS_PREVIAS = [
  { clave: 'sonido', titulo: 'Abrilo con sonido 🔊' },
  { clave: 'para_vos', titulo: 'Para vos' },
  { clave: 'mira', titulo: 'Mirá esto 👀' },
  { clave: 'ratito', titulo: 'Cuando tengas un ratito' },
] as const

export type ClaveVistaPrevia = (typeof VISTAS_PREVIAS)[number]['clave']

export const tituloVistaPrevia = (c: string) =>
  (VISTAS_PREVIAS.find((v) => v.clave === c) ?? VISTAS_PREVIAS[0]).titulo
