import { useQuery } from '@tanstack/react-query'
import { pedir } from '../api/cliente'
import './Inicio.css'

// Marcador de la Fase 0: confirma que el frontend arranca y habla con el backend.
// En la Fase 1 se reemplaza por el Inicio con todas las ocasiones (porting del prototipo).
export default function Inicio() {
  const salud = useQuery({
    queryKey: ['health'],
    queryFn: () => pedir<{ estado: string }>('/health'),
  })

  return (
    <main className="inicio base-inicio">
      <h1 className="base-titulo">Cartita</h1>
      <p className="base-nota">cartas que se abren como un regalo</p>
      <p className="base-sello">
        backend: {salud.isPending ? '…' : salud.isSuccess ? salud.data.estado : 'sin conexión'}
      </p>
    </main>
  )
}
