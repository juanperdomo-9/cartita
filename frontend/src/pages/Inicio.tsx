import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { TemaBoton, useClaseHtml } from '../lib/tema'
import { OCASIONES, type Ocasion } from '../ocasiones'

function Sobre({ o }: { o: Ocasion }) {
  const estilo = { '--c': o.tarjeta.color, '--s': o.tarjeta.sello, '--r': o.tarjeta.giro } as CSSProperties
  return (
    <span className="oc-sobre" style={estilo}>
      <span className="oc-sello">{o.tarjeta.emoji}</span>
      <span className="oc-nombre">{o.nombre}</span>
      {!o.activa && <span className="oc-prox">PRÓXIMAMENTE</span>}
    </span>
  )
}

/** Inicio: presenta Cartita y todas las ocasiones (porting del prototipo). */
export default function Inicio() {
  useClaseHtml('en-inicio')
  return (
    <main className="armar ancho">
      <section className="inicio">
        <header className="tope envolver">
          <span className="marca-mano">Cartita</span>
          <div className="tope-der">
            <TemaBoton />
          </div>
        </header>
        <div className="envolver inicio-hero">
          <p className="nota-mano">cartas que se abren como un regalo</p>
          <h1 className="serif">
            ¿Qué{' '}
            <span className="subrayado">
              festejamos
              <svg className="trazo" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength={1} d="M4 15C58 7 118 5 178 9S268 17 296 7" />
              </svg>
            </span>
            ?
          </h1>
          <p className="bajada-papel">
            Elegí la ocasión y armá una carta con fotos, audios de la familia, su canción y un regalito para raspar. Se
            manda por WhatsApp y se abre como un regalo.
          </p>
          <p className="nota-mano elegi">elegí una ↓</p>
        </div>
        <div className="envolver ocasiones">
          {OCASIONES.map((o) =>
            o.activa ? (
              <Link className="oc" to={o.ruta} key={o.clave}>
                <Sobre o={o} />
                <span className="oc-fecha">{o.tarjeta.fecha}</span>
                <span className="nota-mano">¡ya podés armarla!</span>
              </Link>
            ) : (
              <div className="oc prox" aria-disabled="true" key={o.clave}>
                <Sobre o={o} />
                <span className="oc-fecha">{o.tarjeta.fecha}</span>
              </div>
            ),
          )}
        </div>
        <footer className="pie-papel envolver">
          <span>Cartita</span>
          <span>hecho a mano en Argentina · 2026</span>
        </footer>
      </section>
    </main>
  )
}
