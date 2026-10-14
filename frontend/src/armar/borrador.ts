// Estado del armado: los textos se guardan como borrador en el navegador (localStorage);
// las fotos y los audios quedan en memoria hasta crear la carta, como el prototipo.

import type { CartaCrear } from '../api/cartas'
import type { CartaVista, Estilo } from '../carta/tipos'
import type { AudioListo, FotoLista } from '../lib/archivos'
import { leerCancion } from '../lib/cancion'
import type { OcasionActiva } from '../ocasiones'

export interface Borrador {
  para: string
  de: string
  desde: string
  titulo: string
  subtitulo: string
  estilo: Estilo
  carta: string
  lugar: string
  recuerdo: string
  pc0: string
  pc1: string
  pc2: string
  antesTxt: string
  ahoraTxt: string
  gracias: string
  cancion: string
  cancionNombre: string
  regaloTitulo: string
  regaloDetalle: string
  entrega: 'ya' | 'dia' | 'otra'
  fecha: string
}

export const VACIO: Borrador = {
  para: '',
  de: '',
  desde: '',
  titulo: '',
  subtitulo: '',
  estilo: 'papel',
  carta: '',
  lugar: '',
  recuerdo: '',
  pc0: '',
  pc1: '',
  pc2: '',
  antesTxt: '',
  ahoraTxt: '',
  gracias: '',
  cancion: '',
  cancionNombre: '',
  regaloTitulo: '',
  regaloDetalle: '',
  entrega: 'ya',
  fecha: '',
}

export type LugarFoto = 'principal' | 'p0' | 'p1' | 'p2' | 'antes' | 'ahora'
export type Fotos = Record<LugarFoto, FotoLista | null> & { pila: FotoLista[] }

export const SIN_FOTOS: Fotos = { principal: null, p0: null, p1: null, p2: null, antes: null, ahora: null, pila: [] }

const clave = (o: OcasionActiva) => 'cartita-borrador-' + o.clave

export function cargarBorrador(o: OcasionActiva): Borrador {
  try {
    const d = JSON.parse(localStorage.getItem(clave(o)) || 'null')
    if (d && typeof d === 'object') {
      const limpio = { ...VACIO }
      for (const k of Object.keys(VACIO) as (keyof Borrador)[]) if (typeof d[k] === 'string') (limpio[k] as string) = d[k]
      if (!['ya', 'dia', 'otra'].includes(limpio.entrega)) limpio.entrega = 'ya'
      if (limpio.estilo !== 'bordo') limpio.estilo = 'papel'
      return limpio
    }
  } catch {
    /* sin borrador */
  }
  return { ...VACIO }
}

export function guardarBorrador(o: OcasionActiva, b: Borrador) {
  try {
    localStorage.setItem(clave(o), JSON.stringify(b))
  } catch {
    /* sin borrador */
  }
}

export const lineasGracias = (g: string) =>
  g
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

export function abreDesde(b: Borrador, o: OcasionActiva): string | null {
  if (b.entrega === 'dia' && o.apertura) return o.apertura.iso
  if (b.entrega === 'otra' && b.fecha) {
    const t = new Date(b.fecha)
    if (!isNaN(t.getTime())) return t.toISOString()
  }
  return null
}

function cancionOk(b: Borrador) {
  const c = leerCancion(b.cancion)
  return c && !('error' in c) ? c : null
}

/** Lo que se manda a `POST /api/cartas`. */
export function aCrear(b: Borrador, o: OcasionActiva): CartaCrear {
  return {
    ocasion: o.clave,
    para: b.para.trim(),
    de: b.de.trim(),
    desde: o.contador && b.desde ? b.desde : null,
    titulo: b.titulo.trim(),
    subtitulo: b.subtitulo.trim(),
    carta: b.carta.trim(),
    lugar: b.lugar.trim(),
    recuerdo: b.recuerdo.trim(),
    polas: [b.pc0.trim(), b.pc1.trim(), b.pc2.trim()],
    antes_txt: b.antesTxt.trim(),
    ahora_txt: b.ahoraTxt.trim(),
    gracias: lineasGracias(b.gracias)
      .slice(0, 6)
      .map((g) => g.slice(0, 60)),
    cancion: cancionOk(b) ? b.cancion.trim() : null,
    cancion_nombre: b.cancionNombre.trim(),
    regalo_titulo: b.regaloTitulo.trim(),
    regalo_detalle: b.regaloDetalle.trim(),
    estilo: b.estilo,
    abre_desde: abreDesde(b, o),
  }
}

/** Para la vista previa: la carta tal como la vería ella, con las fotos en memoria. */
export function aVistaPrevia(b: Borrador, o: OcasionActiva, f: Fotos, audios: AudioListo[]): CartaVista {
  const foto = (x: FotoLista | null) => (x ? { url: x.url, ancho: x.ancho, alto: x.alto } : null)
  return {
    ocasion: o.clave,
    para: b.para.trim() || o.textos.paraDefecto,
    de: b.de.trim() || 'Tu hijo',
    desde: o.contador ? b.desde : '',
    titulo: b.titulo.trim(),
    subtitulo: b.subtitulo.trim(),
    carta: b.carta.trim(),
    lugar: b.lugar.trim(),
    recuerdo: b.recuerdo.trim(),
    polas: [b.pc0.trim(), b.pc1.trim(), b.pc2.trim()],
    antesTxt: b.antesTxt.trim(),
    ahoraTxt: b.ahoraTxt.trim(),
    gracias: lineasGracias(b.gracias).slice(0, 6),
    cancion: cancionOk(b),
    cancionNombre: b.cancionNombre.trim(),
    regaloTitulo: b.regaloTitulo.trim(),
    regaloDetalle: b.regaloDetalle.trim(),
    estilo: b.estilo,
    abreDesde: abreDesde(b, o),
    fotos: {
      principal: foto(f.principal),
      p0: foto(f.p0),
      p1: foto(f.p1),
      p2: foto(f.p2),
      antes: foto(f.antes),
      ahora: foto(f.ahora),
      pila: f.pila.map(foto),
    },
    audios: audios.map((a) => ({ quien: a.quien.trim(), seg: a.seg, src: a.url })),
    mensajes: [],
  }
}
