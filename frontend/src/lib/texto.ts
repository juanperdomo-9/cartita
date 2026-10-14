// Utilidades de texto, iguales a las del prototipo.

/** Si el título no tiene cursiva marcada con *…*, la última palabra sale en cursiva. */
export function marcar(texto: string): string {
  const t = String(texto || '').trim()
  if (!t || t.includes('*')) return t
  const i = t.lastIndexOf(' ')
  return i < 0 ? '*' + t + '*' : t.slice(0, i + 1) + '*' + t.slice(i + 1) + '*'
}

/** "Sofi, Juan y Tomi" firma en plural. */
export function esPlural(de: string): boolean {
  return /,|\sy\s|\se\s/i.test(' ' + String(de || '') + ' ')
}

/** Parte un texto con *cursivas* en trozos: los impares van en cursiva. */
export function partesCursiva(texto: string): string[] {
  return String(texto).split(/\*(.+?)\*/)
}

export const mmss = (s: number) =>
  s > 0 ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : '—'

export function fechaLinda(iso: string | number | Date): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '') +
    ' a las ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  )
}
