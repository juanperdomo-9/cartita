// Cliente para hablar con el backend.
// En producción la web y la API son el mismo servicio: las rutas van relativas (/api/...).
// En desarrollo usa el mismo host que la página en el puerto 8000, así se puede probar
// desde el celular en la misma red (http://IP-de-la-compu:5173). VITE_API_URL lo pisa.
const PORDEFECTO = import.meta.env.PROD ? '' : `${location.protocol}//${location.hostname}:8000`
export const API_URL = (import.meta.env.VITE_API_URL ?? PORDEFECTO).replace(/\/$/, '')

export class ErrorApi extends Error {
  estado: number

  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

/** Mensaje en castellano para mostrar: el `detail` del backend o uno genérico. */
async function mensajeDe(r: Response): Promise<string> {
  try {
    const cuerpo = await r.json()
    if (typeof cuerpo.detail === 'string') return cuerpo.detail
    if (Array.isArray(cuerpo.detail)) return 'Algún dato no es válido. Revisá lo que escribiste.'
  } catch {
    /* sin cuerpo */
  }
  if (r.status === 429) return 'Demasiados intentos. Probá de nuevo en un rato.'
  return 'No se pudo completar. Probá de nuevo en un rato.'
}

export async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(API_URL + ruta, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ErrorApi(0, 'No hay conexión. Revisá internet y probá de nuevo.')
  }
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, await mensajeDe(respuesta))
  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}
