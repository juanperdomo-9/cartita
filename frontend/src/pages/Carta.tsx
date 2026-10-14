import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { aVista, desfaseDe, registrarEvento, verCarta, verCartaAdmin } from '../api/cartas'
import { ErrorApi } from '../api/cliente'
import Escena from '../carta/Escena'
import { esMia } from '../lib/archivos'

/** Pantalla de aviso dentro de la escena ("Abriendo tu carta…", errores). */
function Aviso({ titulo, texto, boton }: { titulo: string; texto?: string; boton?: boolean }) {
  useEffect(() => {
    document.body.classList.add('modo-carta')
    return () => document.body.classList.remove('modo-carta')
  }, [])
  return (
    <div className="escena">
      <section className="pantalla aviso on">
        <h2 className="titulo lg">{titulo}</h2>
        {texto && <p className="suave">{texto}</p>}
        {boton && (
          <a className="btn" href="/">
            Hacer una carta
          </a>
        )}
      </section>
    </div>
  )
}

function errorCarta(e: unknown) {
  return e instanceof ErrorApi && e.estado === 404 ? (
    <Aviso titulo="No encontramos esta carta" texto="Revisá que el link esté completo." boton />
  ) : (
    <Aviso titulo="No pudimos abrir la carta" texto="Probá de nuevo en un rato." boton />
  )
}

/** La carta de ella: /c/{slug}. Registra visto, abierta, abrazos y respuesta. */
export function CartaElla() {
  const { slug = '' } = useParams()
  const q = useQuery({ queryKey: ['carta', slug], queryFn: () => verCarta(slug), staleTime: Infinity })
  const datos = useMemo(() => (q.data ? aVista(q.data) : null), [q.data])
  // Si quien la armó la abre desde su propio celular, no cuenta como que ella la abrió.
  const propia = useMemo(() => esMia(slug), [slug])

  if (q.isPending) return <Aviso titulo="Abriendo tu carta…" />
  if (q.isError || !datos) return errorCarta(q.error)
  return (
    <Escena
      datos={datos}
      modo="link"
      desfase={desfaseDe(q.data)}
      onEvento={(e) => {
        if (!propia) registrarEvento(slug, e)
      }}
      onRecargar={() => q.refetch()}
    />
  )
}

/** "Ver la carta" desde el seguimiento: /e/{token}/carta. No registra eventos. */
export function CartaAdmin() {
  const { token = '' } = useParams()
  const navegar = useNavigate()
  const q = useQuery({ queryKey: ['carta-admin', token], queryFn: () => verCartaAdmin(token), staleTime: Infinity })
  const datos = useMemo(() => (q.data ? aVista(q.data) : null), [q.data])

  if (q.isPending) return <Aviso titulo="Abriendo tu carta…" />
  if (q.isError || !datos) return errorCarta(q.error)
  return <Escena datos={datos} modo="ver" desfase={desfaseDe(q.data)} onCerrar={() => navegar('/e/' + token)} />
}
