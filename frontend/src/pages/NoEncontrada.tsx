import { Link } from 'react-router'
import './Inicio.css'

export default function NoEncontrada() {
  return (
    <main className="inicio base-inicio">
      <h1 className="base-titulo">Uy</h1>
      <p className="base-nota">esta página no existe</p>
      <Link to="/" className="base-sello">
        volver al inicio
      </Link>
    </main>
  )
}
