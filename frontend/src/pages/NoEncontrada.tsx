import { Link } from 'react-router'
import { Marca } from '../components/comunes'

export default function NoEncontrada() {
  return (
    <main className="armar">
      <Marca />
      <section className="pagina">
        <p className="eyebrow">Uy</p>
        <h1 className="titulo">
          Esta página <em>no existe.</em>
        </h1>
        <p className="explica">Revisá que el link esté completo.</p>
        <Link className="btn rosa" to="/" style={{ justifySelf: 'start' }}>
          Ir al inicio
        </Link>
      </section>
    </main>
  )
}
