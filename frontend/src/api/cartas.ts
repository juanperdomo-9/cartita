// Endpoints de cartas, familia y seguimiento, y la conversión a lo que usa la carta.

import type { CartaEnEspera, CartaVista, Estilo, EventoCarta, Foto } from '../carta/tipos'
import type { Cancion } from '../lib/cancion'
import type { ClaveOcasion } from '../ocasiones'
import { pedir } from './cliente'

// ---------- Tipos de la API ----------
export interface CartaCrear {
  ocasion: ClaveOcasion
  para: string
  de: string
  desde: string | null
  titulo: string
  subtitulo: string
  carta: string
  lugar: string
  recuerdo: string
  polas: string[]
  antes_txt: string
  ahora_txt: string
  gracias: string[]
  cancion: string | null
  cancion_nombre: string
  regalo_titulo: string
  regalo_detalle: string
  estilo: Estilo
  vista_previa: string
  abre_desde: string | null
}

export interface CartaCreada {
  id: string
  slug: string
  token_familia: string
  token_admin: string
}

export interface PedidoArchivo {
  tipo: 'foto' | 'audio' | 'video'
  mime: string
  bytes: number
  ancho?: number
  alto?: number
  duracion_seg?: number
}

export type Rol = 'principal' | 'p0' | 'p1' | 'p2' | 'antes' | 'ahora' | 'pila' | 'audio_autor'

interface ArchivoFirmado {
  id: string
  subida: { url: string; metodo: string; headers: Record<string, string> }
}

interface AudioApi {
  url: string
  quien: string
  seg: number
}

interface FotoApi {
  url: string
  tipo?: 'foto' | 'video'
  ancho: number | null
  alto: number | null
}

export interface CartaApi {
  estado: 'espera' | 'abierta'
  ocasion: ClaveOcasion
  para: string
  de: string
  estilo: Estilo
  abre_desde: string | null
  ahora: string
  contenido: {
    desde: string | null
    titulo: string
    subtitulo: string
    carta: string
    lugar: string
    recuerdo: string
    polas: string[]
    antes_txt: string
    ahora_txt: string
    gracias: string[]
    cancion: Cancion | null
    cancion_nombre: string
    regalo_titulo: string
    regalo_detalle: string
    fotos: {
      principal: FotoApi | null
      p0: FotoApi | null
      p1: FotoApi | null
      p2: FotoApi | null
      antes: FotoApi | null
      ahora: FotoApi | null
      pila: FotoApi[]
    }
    audios: AudioApi[]
    mensajes: { id: string; nombre: string; texto: string; foto: FotoApi | null; audio: AudioApi | null }[]
  } | null
}

export interface Seguimiento {
  id: string
  slug: string
  token_familia: string
  ocasion: ClaveOcasion
  estado: string
  para: string
  de: string
  abre_desde: string | null
  creada_a: string
  ahora: string
  lectura: {
    visto_a: string | null
    abierta_a: string | null
    abrazos: number
    respuesta: string | null
    respuesta_a: string | null
  }
  mensajes: {
    id: string
    nombre: string
    texto: string
    visible: boolean
    con_foto: boolean
    con_audio: boolean
    creado_a: string
  }[]
}

// ---------- Armar ----------
export const crearCarta = (datos: CartaCrear) =>
  pedir<CartaCreada>('/api/cartas', { method: 'POST', body: JSON.stringify(datos) })

export const publicarCarta = (id: string, token: string) =>
  pedir<{ estado: string }>(`/api/cartas/${id}/publicar`, { method: 'POST', headers: { 'X-Token-Admin': token } })

/** Pide el link firmado, sube el archivo directo al almacenamiento y lo confirma. */
async function subirFirmado(
  firmar: () => Promise<ArchivoFirmado>,
  archivo: Blob,
  cabeceraToken: Record<string, string>,
): Promise<void> {
  const firmado = await firmar()
  const { url, metodo, headers } = firmado.subida
  let r: Response
  try {
    r = await fetch(url, { method: metodo, headers, body: archivo })
  } catch {
    throw new Error('Se cortó la conexión subiendo un archivo.')
  }
  if (!r.ok) throw new Error('No se pudo subir un archivo.')
  await pedir(`/api/archivos/${firmado.id}/confirmar`, { method: 'POST', headers: cabeceraToken })
}

export function subirArchivoCarta(
  carta: Pick<CartaCreada, 'id' | 'token_admin'>,
  archivo: Blob,
  pedido: PedidoArchivo & { rol: Rol; orden?: number; quien?: string },
) {
  const cab = { 'X-Token-Admin': carta.token_admin }
  return subirFirmado(
    () =>
      pedir<ArchivoFirmado>(`/api/cartas/${carta.id}/archivos`, {
        method: 'POST',
        headers: cab,
        body: JSON.stringify(pedido),
      }),
    archivo,
    cab,
  )
}

// ---------- Ella ----------
export const verCarta = (slug: string) => pedir<CartaApi>(`/api/c/${encodeURIComponent(slug)}`)

export function registrarEvento(slug: string, e: EventoCarta) {
  return pedir<void>(`/api/c/${encodeURIComponent(slug)}/eventos`, {
    method: 'POST',
    body: JSON.stringify(e),
    keepalive: true,
  }).catch(() => {})
}

// ---------- Familia ----------
export const verParaFamilia = (token: string) =>
  pedir<{ ocasion: ClaveOcasion; para: string; de: string }>(`/api/s/${encodeURIComponent(token)}`)

export async function sumarMensaje(
  token: string,
  datos: { nombre: string; texto: string },
  archivos: { archivo: Blob; pedido: PedidoArchivo }[],
) {
  const t = encodeURIComponent(token)
  const { id } = await pedir<{ id: string }>(`/api/s/${t}/mensajes`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
  for (const { archivo, pedido } of archivos) {
    await subirFirmado(
      () =>
        pedir<ArchivoFirmado>(`/api/s/${t}/mensajes/${id}/archivos`, {
          method: 'POST',
          body: JSON.stringify(pedido),
        }),
      archivo,
      { 'X-Token-Familia': token },
    )
  }
}

// ---------- Editar ----------
export interface ArchivoGuardado {
  id: string
  tipo: 'foto' | 'audio' | 'video'
  rol: string
  orden: number
  url: string
  ancho: number | null
  alto: number | null
  seg: number
  quien: string
}

export interface CartaParaEditar {
  id: string
  datos: CartaCrear
  archivos: ArchivoGuardado[]
}

export const verEdicion = (token: string) => pedir<CartaParaEditar>(`/api/e/${encodeURIComponent(token)}/editar`)
export const guardarEdicion = (token: string, datos: CartaCrear) =>
  pedir<{ ok: boolean }>(`/api/e/${encodeURIComponent(token)}`, { method: 'PUT', body: JSON.stringify(datos) })
export const borrarArchivo = (token: string, id: string) =>
  pedir<void>(`/api/e/${encodeURIComponent(token)}/archivos/${id}`, { method: 'DELETE' })

// ---------- Seguimiento ----------
export const verSeguimiento = (token: string) => pedir<Seguimiento>(`/api/e/${encodeURIComponent(token)}`)
export const verCartaAdmin = (token: string) => pedir<CartaApi>(`/api/e/${encodeURIComponent(token)}/carta`)
export const cambiarMensaje = (token: string, id: string, visible: boolean) =>
  pedir<{ visible: boolean }>(`/api/e/${encodeURIComponent(token)}/mensajes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ visible }),
  })

// ---------- De la API a la carta ----------
const foto = (f: FotoApi | null | undefined): Foto | null =>
  f ? { url: f.url, ancho: f.ancho, alto: f.alto, video: f.tipo === 'video' } : null

export function aVista(c: CartaApi): CartaVista | CartaEnEspera {
  const x = c.contenido
  if (!x) return { ocasion: c.ocasion, para: c.para, de: c.de, estilo: c.estilo, abreDesde: c.abre_desde! }
  return {
    ocasion: c.ocasion,
    para: c.para,
    de: c.de,
    desde: x.desde || '',
    titulo: x.titulo,
    subtitulo: x.subtitulo,
    carta: x.carta,
    lugar: x.lugar,
    recuerdo: x.recuerdo,
    polas: x.polas,
    antesTxt: x.antes_txt,
    ahoraTxt: x.ahora_txt,
    gracias: x.gracias,
    cancion: x.cancion,
    cancionNombre: x.cancion_nombre,
    regaloTitulo: x.regalo_titulo,
    regaloDetalle: x.regalo_detalle,
    estilo: c.estilo,
    abreDesde: c.abre_desde,
    fotos: {
      principal: foto(x.fotos.principal),
      p0: foto(x.fotos.p0),
      p1: foto(x.fotos.p1),
      p2: foto(x.fotos.p2),
      antes: foto(x.fotos.antes),
      ahora: foto(x.fotos.ahora),
      pila: x.fotos.pila.map(foto),
    },
    audios: x.audios.map((a) => ({ quien: a.quien, seg: a.seg, src: a.url })),
    mensajes: x.mensajes.map((m) => ({
      nombre: m.nombre,
      texto: m.texto,
      foto: foto(m.foto),
      audio: m.audio ? { quien: m.audio.quien, seg: m.audio.seg, src: m.audio.url } : null,
    })),
  }
}

/** Diferencia entre el reloj del servidor y el del celular, para la cuenta regresiva. */
export const desfaseDe = (c: { ahora: string }) => Date.parse(c.ahora) - Date.now()
