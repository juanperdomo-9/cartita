import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { sumarMensaje, verParaFamilia, type PedidoArchivo } from '../api/cartas'
import Audios from '../armar/Audios'
import type { AudioArmado } from '../armar/borrador'
import { ConCursiva, Marca, useToast } from '../components/comunes'
import { comprimir, mimeDe, type FotoLista } from '../lib/archivos'
import { esPlural } from '../lib/texto'
import { ocasionActiva } from '../ocasiones'

/** Link de la familia: /s/{token}. Suman su mensaje, una foto o un audio. No ven la carta. */
export default function Familia() {
  const { token = '' } = useParams()
  const q = useQuery({ queryKey: ['familia', token], queryFn: () => verParaFamilia(token), retry: false })
  const [toast, avisar] = useToast()
  const [nombre, setNombre] = useState('')
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<FotoLista | null>(null)
  const [audios, setAudios] = useState<AudioArmado[]>([])
  const [errores, setErrores] = useState<{ nombre?: string; texto?: string }>({})
  const [estado, setEstado] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  const ocasion = ocasionActiva(q.data?.ocasion || 'dia_madre')

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return setErrores({ nombre: 'Poné tu nombre así sabe quién le escribe.' })
    if (!texto.trim() && !foto && !audios.length)
      return setErrores({ texto: 'Escribile algo, o sumá una foto o un audio.' })
    setEnviando(true)
    setEstado('Guardando…')
    const archivos: { archivo: Blob; pedido: PedidoArchivo }[] = []
    if (foto)
      archivos.push({
        archivo: foto.blob,
        pedido: { tipo: 'foto', mime: 'image/jpeg', bytes: foto.blob.size, ancho: foto.ancho, alto: foto.alto },
      })
    if (audios[0]?.blob)
      archivos.push({
        archivo: audios[0].blob,
        pedido: { tipo: 'audio', mime: mimeDe(audios[0].blob), bytes: audios[0].blob.size, duracion_seg: audios[0].seg },
      })
    try {
      await sumarMensaje(token, { nombre: nombre.trim(), texto: texto.trim() }, archivos)
      setListo(true)
      setEstado('')
    } catch (er) {
      setEstado(er instanceof Error ? er.message : 'No se pudo guardar. Probá de nuevo en un rato.')
    } finally {
      setEnviando(false)
    }
  }

  const otro = () => {
    setNombre('')
    setTexto('')
    setFoto(null)
    setAudios([])
    setListo(false)
  }

  let titulo = 'Cargando…',
    explica = ''
  if (q.isError) {
    titulo = 'No encontramos esta carta'
    explica = 'Revisá que el link esté completo.'
  } else if (q.data) {
    titulo = 'Sumá tu mensaje para *' + q.data.para + '*'
    explica = ocasion.textos.familiaExplica(q.data.de, esPlural(q.data.de), q.data.para)
  }

  return (
    <main className="armar">
      <Marca etiqueta={ocasion.etiqueta} />
      <section className="pagina">
        <p className="eyebrow">Carta grupal</p>
        <h1 className="titulo">
          <ConCursiva texto={titulo} />
        </h1>
        <p className="explica">{explica}</p>
        {q.data && !listo && (
          <form className="paso" style={{ padding: 0 }} noValidate onSubmit={enviar}>
            <div className={'campo' + (errores.nombre ? ' error' : '')}>
              <label htmlFor="f-snombre">Tu nombre</label>
              <input
                type="text"
                id="f-snombre"
                maxLength={40}
                placeholder="Ej.: La abuela, Tía Ceci, Papá"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  setErrores({})
                }}
              />
              <p className="msg">{errores.nombre}</p>
            </div>
            <div className={'campo' + (errores.texto ? ' error' : '')}>
              <label htmlFor="f-stexto">Tu mensaje</label>
              <textarea
                id="f-stexto"
                maxLength={300}
                style={{ minHeight: 140 }}
                placeholder="Feliz día…"
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value)
                  setErrores({})
                }}
              />
              <div className="pie-campo">
                <span className="cuenta">{texto.length} / 300</span>
              </div>
              <p className="msg">{errores.texto}</p>
            </div>
            <div className="campo">
              <span className="lbl">
                Una foto<span className="opc">opcional</span>
              </span>
              <label
                className={'subir grande' + (foto ? ' con-foto' : '')}
                style={foto ? { backgroundImage: `url("${foto.url}")` } : undefined}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Tocá para subir una foto
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Foto del mensaje"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) comprimir(f).then(setFoto, () => avisar('No pudimos leer esa foto.'))
                  }}
                />
              </label>
            </div>
            <div className="campo">
              <span className="lbl">
                Un audio<span className="opc">opcional, menos de un minuto</span>
              </span>
              <Audios audios={audios} onCambio={setAudios} max={1} conNombre={false} onError={avisar} />
            </div>
            <p className="estado" aria-live="polite">
              {estado}
            </p>
            <button type="submit" className="btn rosa" disabled={enviando}>
              Sumar a la carta
            </button>
          </form>
        )}
        {listo && (
          <div className="tarjeta">
            <p className="dato">¡Listo!</p>
            <p className="explica">Tu mensaje ya está en la carta. Ella lo va a ver cuando la abra.</p>
            <button type="button" className="btn vidrio" style={{ justifySelf: 'start' }} onClick={otro}>
              Sumar otro mensaje
            </button>
          </div>
        )}
      </section>
      {toast}
    </main>
  )
}
