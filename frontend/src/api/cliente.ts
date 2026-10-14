// Cliente mínimo para hablar con el backend. La URL sale de VITE_API_URL.
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export class ErrorApi extends Error {
  estado: number

  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

export async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(API_URL + ruta, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, await respuesta.text())
  return respuesta.json() as Promise<T>
}
