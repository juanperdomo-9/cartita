import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { partesCursiva } from '../lib/texto'
import { TemaBoton } from '../lib/tema'

/** Texto con *cursivas* como <em>. */
export function ConCursiva({ texto }: { texto: string }) {
  return (
    <>
      {partesCursiva(texto).map((p, i) => (p ? i % 2 ? <em key={i}>{p}</em> : p : null))}
    </>
  )
}

/** El cartelito de abajo (toast) del prototipo. */
export function useToast(): [ReactNode, (t: string) => void] {
  const [texto, setTexto] = useState<string | null>(null)
  const t = useRef<number>(0)
  const mostrar = useCallback((s: string) => {
    setTexto(s)
    clearTimeout(t.current)
    t.current = window.setTimeout(() => setTexto(null), 3400)
  }, [])
  const nodo = (
    <p className="toast" role="status" hidden={!texto}>
      {texto}
    </p>
  )
  return [nodo, mostrar]
}

/** Marca de arriba del armado y de las páginas (logo, ocasión y tema). */
export function Marca({ etiqueta, logoA = '/' }: { etiqueta?: string; logoA?: string }) {
  return (
    <div className="marca">
      <Link className="logo" to={logoA} style={{ textDecoration: 'none' }}>
        Cart<b>ita</b>
      </Link>
      {etiqueta && <span className="ocasion">{etiqueta}</span>}
      <TemaBoton />
    </div>
  )
}

export const ICONO_PLAY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
)
export const ICONO_PAUSA = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
)
export const ICONO_EQUIS = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

/** Copia al portapapeles; si no se puede, selecciona el texto del nodo. */
export async function copiar(texto: string, nodo?: HTMLElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    if (nodo) {
      const r = document.createRange()
      r.selectNodeContents(nodo)
      const s = getSelection()
      s?.removeAllRanges()
      s?.addRange(r)
    }
    return false
  }
}
