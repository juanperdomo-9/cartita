// Estado del armado: los textos se guardan como borrador en el navegador (localStorage);
// las fotos y los audios quedan en memoria hasta crear la carta, como el prototipo.

import type { CartaCrear, CartaParaEditar } from '../api/cartas'
import type { CartaVista, Estilo } from '../carta/tipos'
import type { AudioListo, FotoLista } from '../lib/archivos'
import { VISTAS_PREVIAS, type ClaveVistaPrevia } from '../lib/vistaPrevia'
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
  vistaPrevia: ClaveVistaPrevia
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
  vistaPrevia: 'sonido',
}

export type LugarFoto = 'principal' | 'p0' | 'p1' | 'p2' | 'antes' | 'ahora'

/** Una foto del armado: nueva (con `blob`, falta subirla) o ya guardada (con `id`). */
export type FotoArmado = Omit<FotoLista, 'blob'> & { blob?: Blob; id?: string }
export type AudioArmado = Omit<AudioListo, 'blob'> & { blob?: Blob; id?: string }
export type Fotos = Record<LugarFoto, FotoArmado | null> & { pila: FotoArmado[] }

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
      if (!VISTAS_PREVIAS.some((v) => v.clave === limpio.vistaPrevia)) limpio.vistaPrevia = 'sonido'
      return limpio
    }
  } catch {
    /* sin borrador */
  }
  return { ...VACIO }
}

export function borrarBorrador(o: OcasionActiva) {
  try {
    localStorage.removeItem(clave(o))
  } catch {
    /* nada */
  }
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
    vista_previa: b.vistaPrevia,
    abre_desde: abreDesde(b, o),
  }
}

/** Para la vista previa: la carta tal como la vería ella, con las fotos en memoria. */
export function aVistaPrevia(b: Borrador, o: OcasionActiva, f: Fotos, audios: AudioArmado[]): CartaVista {
  const foto = (x: FotoArmado | null) => (x ? { url: x.url, ancho: x.ancho, alto: x.alto } : null)
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

/** Fecha para <input type="datetime-local"> en la hora del celular. */
function aLocal(iso: string): string {
  const d = new Date(iso)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`
}

/** Para editar: la carta guardada pasada a borrador, fotos y audios (con su id). */
export function desdeEdicion(e: CartaParaEditar, o: OcasionActiva): { b: Borrador; fotos: Fotos; audios: AudioArmado[] } {
  const d = e.datos
  let entrega: Borrador['entrega'] = 'ya',
    fecha = ''
  if (d.abre_desde && Date.parse(d.abre_desde) > Date.now()) {
    if (o.apertura && Date.parse(o.apertura.iso) === Date.parse(d.abre_desde)) entrega = 'dia'
    else {
      entrega = 'otra'
      fecha = aLocal(d.abre_desde)
    }
  }
  const b: Borrador = {
    para: d.para,
    de: d.de,
    desde: d.desde || '',
    titulo: d.titulo,
    subtitulo: d.subtitulo,
    estilo: d.estilo,
    carta: d.carta,
    lugar: d.lugar,
    recuerdo: d.recuerdo,
    pc0: d.polas[0] || '',
    pc1: d.polas[1] || '',
    pc2: d.polas[2] || '',
    antesTxt: d.antes_txt,
    ahoraTxt: d.ahora_txt,
    gracias: d.gracias.join('\n'),
    cancion: d.cancion || '',
    cancionNombre: d.cancion_nombre,
    regaloTitulo: d.regalo_titulo,
    regaloDetalle: d.regalo_detalle,
    entrega,
    fecha,
    vistaPrevia: VISTAS_PREVIAS.some((v) => v.clave === d.vista_previa) ? (d.vista_previa as ClaveVistaPrevia) : 'sonido',
  }
  const fotos: Fotos = { ...SIN_FOTOS, pila: [] }
  const audios: AudioArmado[] = []
  for (const a of e.archivos) {
    if (a.tipo === 'audio') {
      audios.push({ id: a.id, url: a.url, seg: a.seg, quien: a.quien })
      continue
    }
    const f: FotoArmado = { id: a.id, url: a.url, ancho: a.ancho || 0, alto: a.alto || 0 }
    if (a.rol === 'pila') fotos.pila.push(f)
    else if (a.rol in fotos) fotos[a.rol as LugarFoto] = f
  }
  return { b, fotos, audios }
}

/** Los ids de las fotos y audios guardados que siguen en el armado. */
export function idsPresentes(f: Fotos, audios: AudioArmado[]): Set<string> {
  const ids = [
    ...(['principal', 'p0', 'p1', 'p2', 'antes', 'ahora'] as const).map((k) => f[k]?.id),
    ...f.pila.map((x) => x.id),
    ...audios.map((a) => a.id),
  ]
  return new Set(ids.filter((x): x is string => !!x))
}
