import type { Cancion } from '../lib/cancion'
import type { Muestra } from '../lib/muestras'
import type { ClaveOcasion } from '../ocasiones'

export type Estilo = 'papel' | 'bordo'

export interface Foto {
  url: string
  ancho?: number | null
  alto?: number | null
}

export interface AudioCarta {
  quien: string
  seg: number
  src: string
}

export interface MensajeCarta {
  nombre: string
  texto: string
  foto?: Foto | null
  /** Solo en el ejemplo: ilustración en lugar de foto */
  muestra?: Muestra
  audio?: AudioCarta | null
}

export interface FotosCarta {
  /** Solo en el ejemplo: usar ilustraciones donde no hay foto */
  muestras?: boolean
  principal?: Foto | null
  p0?: Foto | null
  p1?: Foto | null
  p2?: Foto | null
  antes?: Foto | null
  ahora?: Foto | null
  pila: (Foto | null)[]
}

/** Todo lo que necesita la carta para mostrarse completa. */
export interface CartaVista {
  ocasion: ClaveOcasion
  para: string
  de: string
  desde: string
  titulo: string
  subtitulo: string
  carta: string
  lugar: string
  recuerdo: string
  polas: string[]
  antesTxt: string
  ahoraTxt: string
  gracias: string[]
  cancion: Cancion | null
  cancionNombre: string
  regaloTitulo: string
  regaloDetalle: string
  estilo: Estilo
  abreDesde: string | null
  fotos: FotosCarta
  audios: AudioCarta[]
  mensajes: MensajeCarta[]
}

/** Antes de `abre_desde` el backend solo manda esto. */
export interface CartaEnEspera {
  ocasion: ClaveOcasion
  para: string
  de: string
  estilo: Estilo
  abreDesde: string
}

export type ModoCarta = 'link' | 'previa' | 'ejemplo' | 'ver'

export type EventoCarta =
  | { tipo: 'visto' }
  | { tipo: 'abierta' }
  | { tipo: 'abrazos'; cantidad: number }
  | { tipo: 'respuesta'; texto: string }
