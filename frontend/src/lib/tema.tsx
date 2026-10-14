// Tema de la portada y el armado: sigue al celular (claro = papel, oscuro = bordó) y el botón
// lo fija en localStorage ("cartita-tema"), igual que el prototipo.

import { useEffect, useState } from 'react'

const CLAVE = 'cartita-tema'

function leerElegido(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

function oscuroAhora(): boolean {
  const g = leerElegido()
  return g ? g === 'oscuro' : matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTemaOscuro(): [boolean, () => void] {
  const [oscuro, setOscuro] = useState(oscuroAhora)

  useEffect(() => {
    document.documentElement.classList.toggle('oscuro', oscuro)
  }, [oscuro])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const seguir = () => setOscuro(oscuroAhora())
    mq?.addEventListener('change', seguir)
    return () => mq?.removeEventListener('change', seguir)
  }, [])

  const cambiar = () => {
    const nuevo = !document.documentElement.classList.contains('oscuro')
    try {
      localStorage.setItem(CLAVE, nuevo ? 'oscuro' : 'claro')
    } catch {
      /* nada */
    }
    setOscuro(nuevo)
  }
  return [oscuro, cambiar]
}

export function TemaBoton() {
  const [oscuro, cambiar] = useTemaOscuro()
  return (
    <button
      type="button"
      className="tema-btn"
      aria-label={oscuro ? 'Pasar a modo claro' : 'Pasar a modo oscuro'}
      onClick={cambiar}
    >
      <svg className="luna" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="sol" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  )
}

/** Marca el <html> con la clase de la página (en-portada, en-inicio) mientras está montada. */
export function useClaseHtml(clase: string | null) {
  useEffect(() => {
    if (!clase) return
    document.documentElement.classList.add(clase)
    return () => document.documentElement.classList.remove(clase)
  }, [clase])
}
