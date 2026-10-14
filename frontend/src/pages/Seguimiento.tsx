import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { cambiarMensaje, verSeguimiento } from '../api/cartas'
import { ConCursiva, copiar, Marca, useToast } from '../components/comunes'
import { fechaLinda } from '../lib/texto'
import { ocasionActiva } from '../ocasiones'

/** Seguimiento: /e/{token}. Lecturas, abrazos, respuesta y mensajes de la familia. */
export default function Seguimiento() {
  const { token = '' } = useParams()
  const cliente = useQueryClient()
  const q = useQuery({ queryKey: ['seguimiento', token], queryFn: () => verSeguimiento(token), retry: false })
  const [toast, avisar] = useToast()
  const [copiado, setCopiado] = useState('')

  const s = q.data
  const ocasion = ocasionActiva(s?.ocasion || 'dia_madre')
  const link = (ruta: string) => location.origin + ruta

  const copiarLink = async (cual: string, texto: string) => {
    if (await copiar(texto)) {
      setCopiado(cual)
      setTimeout(() => setCopiado(''), 1500)
    } else avisar(texto)
  }

  const ocultar = async (id: string, visible: boolean) => {
    try {
      await cambiarMensaje(token, id, visible)
      cliente.invalidateQueries({ queryKey: ['seguimiento', token] })
      cliente.removeQueries({ queryKey: ['carta-admin', token] })
    } catch {
      avisar('No se pudo cambiar. Probá de nuevo.')
    }
  }

  if (!s)
    return (
      <main className="armar">
        <Marca />
        <section className="pagina">
          <p className="eyebrow">Tu carta</p>
          <h1 className="titulo">{q.isError ? 'No encontramos esta carta' : 'Cargando…'}</h1>
          {q.isError && <p className="explica">Revisá que el link de seguimiento esté completo.</p>}
        </section>
      </main>
    )

  const l = s.lectura
  const ahora = Date.parse(s.ahora)
  const detalle =
    !l.abierta_a && s.abre_desde && Date.parse(s.abre_desde) > ahora
      ? 'Se puede abrir desde el ' + fechaLinda(s.abre_desde) + '.'
      : l.visto_a
        ? 'Entró por primera vez el ' + fechaLinda(l.visto_a) + '.'
        : 'Apenas la abra, te aparece acá.'

  return (
    <main className="armar">
      <Marca etiqueta={ocasion.etiqueta} />
      <section className="pagina">
        <p className="eyebrow">Tu carta</p>
        <h1 className="titulo">
          <ConCursiva texto={'Cómo le cayó a *' + s.para + '*'} />
        </h1>
        <div className="tarjeta">
          <div className="estado-linea">
            <span className={'punto' + (l.abierta_a ? ' si' : '')} />
            <b>
              {l.abierta_a
                ? 'La abrió el ' + fechaLinda(l.abierta_a)
                : l.visto_a
                  ? 'Entró, pero todavía no abrió el sobre'
                  : 'Todavía no la abrió'}
            </b>
          </div>
          <p className="ayuda">{detalle}</p>
        </div>
        <div className="dos-datos">
          <div className="tarjeta">
            <span className="dato">{l.abrazos}</span>
            <span className="ayuda">abrazos que te mandó</span>
          </div>
          <div className="tarjeta">
            <span className="dato">{s.mensajes.length}</span>
            <span className="ayuda">mensajes de la familia</span>
          </div>
        </div>
        {l.respuesta && (
          <div className="tarjeta">
            <span className="eyebrow">Te contestó</span>
            <p className="cita">{l.respuesta}</p>
          </div>
        )}
        {s.mensajes.length > 0 && (
          <div className="tarjeta">
            <span className="eyebrow">Escribieron</span>
            <div className="mensajes-seg">
              {s.mensajes.map((m) => (
                <div className={'mensaje-seg' + (m.visible ? '' : ' oculto')} key={m.id}>
                  <div>
                    <b>{m.nombre}</b>
                    <span>
                      {m.texto || (m.con_foto ? 'Una foto' : m.con_audio ? 'Un audio' : '')}
                      {m.texto && (m.con_foto || m.con_audio) ? ' · con ' + (m.con_foto ? 'foto' : 'audio') : ''}
                    </span>
                  </div>
                  <button type="button" onClick={() => ocultar(m.id, !m.visible)}>
                    {m.visible ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              ))}
            </div>
            <p className="ayuda">Los mensajes ocultos no aparecen en la carta.</p>
          </div>
        )}
        <div className="fila">
          <Link className="btn rosa" to={'/e/' + token + '/carta'}>
            Ver la carta
          </Link>
          <button type="button" className="btn vidrio" onClick={() => q.refetch()}>
            Actualizar
          </button>
          <button type="button" className="btn vidrio" onClick={() => copiarLink('fam', link('/s/' + s.token_familia))}>
            {copiado === 'fam' ? '¡Copiado!' : 'Copiar link para la familia'}
          </button>
          <button type="button" className="btn vidrio" onClick={() => copiarLink('ella', link('/c/' + s.slug))}>
            {copiado === 'ella' ? '¡Copiado!' : 'Copiar su link'}
          </button>
        </div>
        <p className="ayuda">Ver la carta desde acá no cuenta como que ella la abrió.</p>
      </section>
      {toast}
    </main>
  )
}
