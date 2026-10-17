import { useEffect, useRef, useState } from 'react'
import { ICONO_EQUIS, ICONO_PAUSA, ICONO_PLAY } from '../components/comunes'
import { aWav, leerAudio, MAX_AUDIO_SEG } from '../lib/archivos'
import { mmss } from '../lib/texto'
import type { AudioArmado } from './borrador'

// Formatos para grabar, en orden de preferencia. MP4/AAC se escucha en iPhone y en Android;
// si el navegador no puede grabar MP4 (Chrome viejo), queda WebM/Opus.
const FORMATOS = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']

const puedeGrabar = () =>
  typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia

function formatoGrabacion(): string | undefined {
  return FORMATOS.find((f) => MediaRecorder.isTypeSupported?.(f))
}

interface Props {
  audios: AudioArmado[]
  onCambio: (a: AudioArmado[]) => void
  max: number
  conNombre: boolean
  onError: (t: string) => void
  textoSubir?: string
}

/** Lista de audios del armado y de la familia: escuchar, poner de quién es, quitar, subir o grabar. */
export default function Audios({ audios, onCambio, max, conNombre, onError, textoSubir = 'Subir un audio' }: Props) {
  const [sonando, setSonando] = useState<number | null>(null)
  const reproductor = useRef<HTMLAudioElement | null>(null)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const grabador = useRef<MediaRecorder | null>(null)

  useEffect(
    () => () => {
      reproductor.current?.pause()
      grabador.current?.stop()
    },
    [],
  )

  const probar = (i: number) => {
    reproductor.current?.pause()
    if (sonando === i) return setSonando(null)
    const a = new Audio(audios[i].url)
    a.play().catch(() => setSonando(null))
    a.onended = () => setSonando(null)
    reproductor.current = a
    setSonando(i)
  }

  const sumar = async (file?: File) => {
    if (!file) return
    const r = await leerAudio(file)
    if (typeof r === 'string') return onError(r)
    onCambio([...audios, r])
  }

  const grabar = async () => {
    if (grabador.current) {
      grabador.current.stop()
      return
    }
    let flujo: MediaStream
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return onError('No pudimos usar el micrófono. Revisá el permiso del navegador.')
    }
    const formato = formatoGrabacion()
    const rec = new MediaRecorder(flujo, formato ? { mimeType: formato } : undefined)
    const partes: Blob[] = []
    const inicio = Date.now()
    const reloj = window.setInterval(() => {
      const s = Math.floor((Date.now() - inicio) / 1000)
      setSegundos(s)
      if (s >= MAX_AUDIO_SEG) rec.stop()
    }, 250)
    rec.ondataavailable = (e) => e.data.size && partes.push(e.data)
    rec.onstop = () => {
      clearInterval(reloj)
      flujo.getTracks().forEach((t) => t.stop())
      grabador.current = null
      setGrabando(false)
      const tipo = (rec.mimeType || formato || 'audio/webm').split(';')[0]
      const crudo = new Blob(partes, { type: tipo })
      if (!crudo.size) return onError('No se grabó nada. Probá de nuevo.')
      const seg = Math.min(MAX_AUDIO_SEG, Math.max(1, Math.round((Date.now() - inicio) / 1000)))
      // WebM (Chrome sin MP4) no suena en iPhone: se pasa a WAV
      ;(tipo === 'audio/mp4' ? Promise.resolve(crudo) : aWav(crudo)).then((blob) =>
        onCambio([...audios, { blob, url: URL.createObjectURL(blob), seg, quien: '' }]),
      )
    }
    grabador.current = rec
    setSegundos(0)
    setGrabando(true)
    rec.start(1000)
  }

  return (
    <>
      <div className="lista-audios">
        {audios.map((au, i) => (
          <div className="fila-audio" key={au.url}>
            <button type="button" className="play" aria-label="Escuchar" onClick={() => probar(i)}>
              {sonando === i ? ICONO_PAUSA : ICONO_PLAY}
            </button>
            <div>
              {conNombre ? (
                <input
                  type="text"
                  maxLength={30}
                  placeholder="¿De quién es? Ej.: La abuela"
                  aria-label="De quién es el audio"
                  value={au.quien}
                  disabled={!!au.id}
                  title={au.id ? 'Ya está guardado. Para cambiar el nombre, sacalo y subilo de nuevo.' : undefined}
                  onChange={(e) => onCambio(audios.map((x, k) => (k === i ? { ...x, quien: e.target.value } : x)))}
                />
              ) : (
                <b>Tu audio</b>
              )}
              <small>{mmss(au.seg)}</small>
            </div>
            <button
              type="button"
              className="quitar"
              aria-label="Quitar audio"
              onClick={() => {
                if (sonando === i) reproductor.current?.pause()
                setSonando(null)
                onCambio(audios.filter((_, k) => k !== i))
              }}
            >
              {ICONO_EQUIS}
            </button>
          </div>
        ))}
      </div>
      {audios.length < max && (
        <div className="fila" style={{ marginTop: 0 }}>
          {puedeGrabar() && (
            <button type="button" className={'btn ' + (grabando ? 'rosa' : 'vidrio')} onClick={grabar}>
              {grabando ? `Grabando ${mmss(segundos || 0.1)} · Terminar` : 'Grabar un audio'}
            </button>
          )}
          {!grabando && (
            <label className="btn vidrio boton-archivo">
              {textoSubir}
              <input
                type="file"
                accept="audio/*,.opus,.ogg,.oga,.m4a,.mp3,.mpeg,.mpga,.aac,.wav,.webm"
                aria-label={textoSubir}
                onChange={(e) => {
                  sumar(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
      )}
    </>
  )
}
