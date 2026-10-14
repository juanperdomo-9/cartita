import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useParams } from 'react-router'
import { verEdicion } from '../api/cartas'
import Armar from '../armar/Armar'
import { desdeEdicion } from '../armar/borrador'
import { Marca } from '../components/comunes'
import { ocasionActiva } from '../ocasiones'

/** Editar una carta ya creada: /e/{token}/editar. El link de ella sigue siendo el mismo. */
export default function EditarCarta() {
  const { token = '' } = useParams()
  const q = useQuery({ queryKey: ['editar', token], queryFn: () => verEdicion(token), retry: false, gcTime: 0 })
  const ocasion = ocasionActiva(q.data?.datos.ocasion || 'dia_madre')
  const inicial = useMemo(() => (q.data ? desdeEdicion(q.data, ocasion) : null), [q.data, ocasion])

  if (!q.data || !inicial)
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
  return <Armar ocasion={ocasion} edicion={{ token, id: q.data.id, inicial }} />
}
