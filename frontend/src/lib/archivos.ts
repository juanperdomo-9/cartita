// Fotos y audios del lado del navegador: achicar fotos, medir audios y "Tus cartas".

export interface FotoLista {
  blob: Blob
  url: string
  ancho: number
  alto: number
}

export interface AudioListo {
  blob: Blob
  url: string
  seg: number
  quien: string
}

const MAX_LADO = 1600
const MAX_BYTES = 1_400_000 // el backend acepta hasta 1,5 MB

function aBlob(c: HTMLCanvasElement, calidad: number): Promise<Blob | null> {
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', calidad))
}

/** Achica la foto a 1600 px y la pasa a JPG, como el prototipo. */
export function comprimir(file: File, max = MAX_LADO): Promise<FotoLista> {
  return new Promise((ok, mal) => {
    const img = new Image(),
      url = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(url)
      let k = Math.min(1, max / Math.max(img.width, img.height))
      for (let intento = 0; intento < 4; intento++) {
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        for (const calidad of [0.82, 0.7, 0.58]) {
          const blob = await aBlob(c, calidad)
          if (blob && blob.size <= MAX_BYTES)
            return ok({ blob, url: URL.createObjectURL(blob), ancho: c.width, alto: c.height })
        }
        k *= 0.75
      }
      mal(new Error('foto'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      mal(new Error('foto'))
    }
    img.src = url
  })
}

export function duracion(src: string): Promise<number> {
  return new Promise((ok) => {
    const a = new Audio()
    a.preload = 'metadata'
    a.onloadedmetadata = () => {
      if (isFinite(a.duration)) return ok(a.duration)
      // Las grabaciones de Chrome (webm) no traen la duración: se fuerza a calcularla.
      a.currentTime = 1e7
      a.ontimeupdate = () => {
        a.ontimeupdate = null
        ok(isFinite(a.duration) ? a.duration : 0)
      }
    }
    a.onerror = () => ok(0)
    a.src = src
    setTimeout(() => ok(0), 4000)
  })
}

export const MAX_AUDIO_BYTES = 3 * 1024 * 1024
export const MAX_AUDIO_SEG = 90

/**
 * El formato real del audio, mirando sus primeros bytes. El tipo que informa el celular no
 * sirve: un audio reenviado de WhatsApp (.opus) suele llegar sin tipo o con uno equivocado.
 */
async function tipoDeAudio(file: Blob): Promise<string | null> {
  const c = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const txt = (a: number, b: number) => String.fromCharCode(...c.slice(a, b))
  if (txt(0, 4) === 'OggS') return 'audio/ogg'
  if (txt(4, 8) === 'ftyp') return 'audio/mp4'
  if (txt(0, 4) === 'RIFF' && txt(8, 12) === 'WAVE') return 'audio/wav'
  if (c[0] === 0x1a && c[1] === 0x45 && c[2] === 0xdf && c[3] === 0xa3) return 'audio/webm'
  if (txt(0, 3) === 'ID3' || (c[0] === 0xff && (c[1] & 0xe0) === 0xe0)) return 'audio/mpeg'
  return null
}

/** Lee un audio subido como archivo. Devuelve un mensaje si no sirve. */
export async function leerAudio(file: File): Promise<AudioListo | string> {
  if (file.size > MAX_AUDIO_BYTES) return 'Ese audio es muy largo. Probá con uno de menos de un minuto y medio.'
  const tipo = await tipoDeAudio(file)
  if (!tipo) return 'Ese archivo no es un audio que podamos usar (mp3, m4a, ogg/opus, wav o webm).'
  const blob = new Blob([file], { type: tipo })
  const url = URL.createObjectURL(blob)
  const seg = Math.round(await duracion(url))
  if (seg > MAX_AUDIO_SEG) return 'Ese audio dura más de un minuto y medio. Probá con uno más corto.'
  return { blob, url, seg, quien: '' }
}

export const mimeDe = (b: Blob) => (b.type || 'audio/mp4').split(';')[0]

// ---------- Tus cartas (en este navegador) ----------
export interface Mia {
  token: string
  slug: string
  para: string
  creada: number
}

const MIAS = 'cartita-mias'

export function mias(): Mia[] {
  try {
    const l = JSON.parse(localStorage.getItem(MIAS) || '[]')
    return Array.isArray(l) ? l.filter((m) => m && typeof m.token === 'string' && m.token.length > 20) : []
  } catch {
    return []
  }
}

export function guardarMia(m: Mia) {
  try {
    const l = mias().filter((x) => x.token !== m.token)
    l.unshift(m)
    localStorage.setItem(MIAS, JSON.stringify(l.slice(0, 20)))
  } catch {
    /* nada */
  }
}

export const esMia = (slug: string) => mias().some((m) => m.slug === slug)
