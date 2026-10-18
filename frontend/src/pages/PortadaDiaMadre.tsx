import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { mias } from '../lib/archivos'
import { fuenteMuestra, imagenMuestra } from '../lib/muestras'
import { TemaBoton, useClaseHtml } from '../lib/tema'
import { diaMadre } from '../ocasiones/diaMadre'

const RUTA = diaMadre.ruta

function faltan(): string {
  const hoy = new Date()
  const n = Math.round(
    (new Date(2026, 9, 18).getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 864e5,
  )
  if (n > 1) return 'para el domingo 18 · faltan ' + n + ' días'
  if (n === 1) return 'para el domingo 18 · ¡es mañana!'
  if (n === 0) return '¡hoy es el Día de la Madre!'
  return 'para mamá, cualquier día'
}

const Trazo = ({ d, ...p }: { d: string; className?: string; width?: number; height?: number; viewBox: string; preserveAspectRatio?: string }) => (
  <svg {...p} className={'trazo' + (p.className ? ' ' + p.className : '')} aria-hidden="true">
    {d.split('|').map((x) => (
      <path key={x} pathLength={1} d={x} />
    ))}
  </svg>
)
const CORAZON_TRAZO = 'M12 20C6 15 2 11 3 6.5 4 3 8.5 2.5 11.5 6.5 14 2.5 19.5 2.5 20.8 6.5 22 11 17 15.5 12 20Z'
const SUBRAYADO = 'M4 15C58 7 118 5 178 9S268 17 296 7'

/** Portada de Día de la Madre en /dia-de-la-madre (porting fiel del prototipo). */
export default function PortadaDiaMadre() {
  useClaseHtml('en-portada')
  const navegar = useNavigate()
  const empezar = () => navegar(RUTA + '/crear')
  const ejemplo = () => navegar(RUTA + '/ejemplo')
  const ir = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
  const lista = mias()
  const fondo = (k: Parameters<typeof imagenMuestra>[0]) => ({ backgroundImage: imagenMuestra(k) })

  return (
    <main className="armar ancho">
      <section className="intro">
        <header className="tope envolver">
          <Link className="marca-mano" to="/" aria-label="Cartita, inicio">
            Cartita
            <Trazo width={22} height={20} viewBox="0 0 24 22" d={CORAZON_TRAZO} />
          </Link>
          <nav className="tope-links" aria-label="Secciones">
            <a href="#trae" onClick={ir('trae')}>qué lleva</a>
            <a href="#como" onClick={ir('como')}>cómo se hace</a>
            <a href="#preguntas" onClick={ir('preguntas')}>preguntas</a>
          </nav>
          <div className="tope-der">
            <TemaBoton />
            <button type="button" className="btn-mano chico tope-cta" onClick={empezar}>
              Armar mi carta
            </button>
          </div>
        </header>

        <div className="hero-papel envolver">
          <div className="hero-txt">
            <p className="nota-mano roja">{faltan()}</p>
            <h1 className="serif">
              Escribile a tu{' '}
              <span className="subrayado">
                mamá
                <Trazo viewBox="0 0 300 24" preserveAspectRatio="none" d={SUBRAYADO} />
              </span>
              .
            </h1>
            <p className="aparte">(sí, a tu vieja)</p>
            <p className="bajada-papel">
              Como las cartitas que le hacías en la primaria, pero con fotos, audios de toda la familia y su canción. Se
              la mandás por WhatsApp y la abre como un regalo, con sobre y todo.
            </p>
            <div className="ctas-papel">
              <button type="button" className="btn-mano" onClick={empezar}>
                Armar mi carta
              </button>
              <button type="button" className="link-mano" onClick={ejemplo}>
                o mirá una de ejemplo →
              </button>
            </div>
            <p className="aclara">Es gratis y ella no tiene que bajarse nada.</p>
          </div>

          <div className="hero-sobre">
            <span className="estampilla" aria-hidden="true">
              <span className="estampilla-in">
                <svg width="34" height="34" viewBox="0 0 40 40">
                  <g fill="#fff6ec">
                    <circle cx="20" cy="11" r="7" />
                    <circle cx="29" cy="18" r="7" />
                    <circle cx="26" cy="28" r="7" />
                    <circle cx="14" cy="28" r="7" />
                    <circle cx="11" cy="18" r="7" />
                  </g>
                  <circle cx="20" cy="20" r="5" fill="#f2b84b" />
                </svg>
                <small>CORREO DE MAMÁ</small>
                <b>$ 18</b>
              </span>
            </span>
            <svg className="matasellos" viewBox="0 0 120 70" aria-hidden="true">
              <circle cx="35" cy="35" r="28" fill="none" stroke="currentColor" strokeWidth="2" />
              <text x="35" y="31" textAnchor="middle" fontFamily="Courier Prime, monospace" fontSize="9" fontWeight="700" fill="currentColor">
                18 OCT
              </text>
              <text x="35" y="44" textAnchor="middle" fontFamily="Courier Prime, monospace" fontSize="9" fontWeight="700" fill="currentColor">
                2026
              </text>
              <path d="M66 22q9-6 18 0t18 0 16 0M66 35q9-6 18 0t18 0 16 0M66 48q9-6 18 0t18 0 16 0" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <button type="button" className="sobre-mesa" onClick={ejemplo} aria-label="Abrir una carta de ejemplo">
              <svg viewBox="0 0 440 380" aria-hidden="true">
                <ellipse cx="220" cy="356" rx="196" ry="14" fill="#5b4632" opacity=".16" />
                <g transform="rotate(-4 220 220)">
                  <path d="M40 160L220 46 400 160Z" fill="#dcc49c" />
                  <rect x="40" y="160" width="360" height="190" rx="5" fill="#e6d3b1" />
                  <g className="sale-hoja">
                    <g transform="rotate(-3 200 160)">
                      <rect x="92" y="54" width="214" height="230" rx="2" fill="#fcf9f2" />
                      <g stroke="#c4d6ee" strokeWidth="1.2">
                        {[98, 122, 146, 170, 194, 218, 242].map((y) => (
                          <line key={y} x1="92" y1={y} x2="306" y2={y} />
                        ))}
                      </g>
                      <line x1="118" y1="54" x2="118" y2="284" stroke="#e7a3a3" strokeWidth="1.4" />
                      <text fontFamily="Kalam, cursive" fontSize="19" fill="#2346a0">
                        <tspan x="126" y="94">Ma:</tspan>
                        <tspan x="126" y="118">Gracias por todo,</tspan>
                        <tspan x="126" y="142">por esperarme</tspan>
                        <tspan x="126" y="166">despierta y por</tspan>
                      </text>
                    </g>
                  </g>
                  <g className="sale-foto">
                    <g transform="rotate(9 322 116)">
                      <rect x="262" y="38" width="120" height="142" fill="#fffdf8" />
                      <image x="270" y="46" width="104" height="104" preserveAspectRatio="xMidYMid slice" href={fuenteMuestra('mar', 400, 400)} />
                      <text x="322" y="170" textAnchor="middle" fontFamily="Kalam, cursive" fontSize="15" fill="#2a211b">
                        Ese verano
                      </text>
                    </g>
                  </g>
                  <path d="M40 160L212 262 40 350Z" fill="#eedfc3" />
                  <path d="M400 160L228 262 400 350Z" fill="#eadabc" />
                  <path d="M40 350L220 232 400 350Z" fill="#f3e7d0" />
                  <path d="M40 350L220 232 400 350" fill="none" stroke="#5b4632" strokeOpacity=".12" strokeWidth="1.5" />
                  <text x="220" y="318" textAnchor="middle" fontFamily="Kalam, cursive" fontSize="30" fill="#2346a0">
                    Para Ma
                  </text>
                  <path d="M276 300c-4-5-9-6-11-2-2 3 1 7 11 13 10-6 13-10 11-13-2-4-7-3-11 2Z" fill="#cf3f45" />
                </g>
              </svg>
            </button>
            <p className="nota-mano flecha-nota">
              <Trazo width={70} height={46} viewBox="0 0 70 46" d="M66 40C46 42 22 34 12 8|M4 16L11 6 21 13" />
              tocalo, es una de ejemplo
            </p>
          </div>
        </div>

        {lista.length > 0 && (
          <div className="envolver">
            <div className="seccion" id="sec-mias">
              <h2 className="serif chico-t">Tus cartas</h2>
              <div className="mias">
                {lista.map((m) => (
                  <Link to={'/e/' + m.token} key={m.token}>
                    <b>Para {String(m.para || 'Ma').slice(0, 20)}</b>
                    <span>Ver cómo le cayó →</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <section className="adentro envolver" id="trae">
          <div className="titulo-mano">
            <h2 className="serif">Lo que va adentro</h2>
            <p className="nota-mano">(todo es opcional: ponés lo que tengas)</p>
          </div>
          <div className="mesa">
            <figure className="obj o1">
              <div className="hoja-chica">
                <p>Ma:</p>
                <p>Gracias por esperarme despierta y por creer en mí cuando ni yo creía.</p>
                <p className="firma">Juan</p>
              </div>
              <figcaption>
                tu carta, con tu letra <span>(bueno, casi)</span>
              </figcaption>
            </figure>
            <figure className="obj o2">
              <div className="polas-mesa">
                <span>
                  <i style={fondo('mar')} />
                  <b>Ese verano</b>
                </span>
                <span>
                  <i style={fondo('luces')} />
                  <b>Tu cumple</b>
                </span>
              </div>
              <figcaption>fotos que caen como polaroids</figcaption>
            </figure>
            <figure className="obj o3">
              <div className="cassette">
                <div className="et-c">
                  <span>audios para Ma</span>
                  <div className="ventana">
                    <i className="carrete" />
                    <i className="carrete" />
                  </div>
                </div>
                <div className="boca" />
              </div>
              <figcaption>audios de la abuela, los primos, de quien quieras</figcaption>
            </figure>
            <figure className="obj o4">
              <div className="disco gira">
                <div className="vinilo">
                  <div className="etiqueta">
                    <span>Para Ma</span>
                  </div>
                </div>
                <div className="brillo" />
              </div>
              <figcaption>
                su canción <span>(pegás el link de YouTube)</span>
              </figcaption>
            </figure>
            <figure className="obj o5">
              <div className="notas-mesa">
                <div>
                  ¡Feliz día, cuñada! Gracias por cada asado.<b>Tía Ceci</b>
                </div>
                <div>
                  Gracias por esta familia que armaste.<b>Papá</b>
                </div>
              </div>
              <figcaption>la familia suma su mensaje con otro link</figcaption>
            </figure>
            <figure className="obj o6">
              <div className="mini-comp">
                <div className="capa ahora" style={fondo('flores')} />
                <div className="capa antes" style={fondo('sierras')} />
                <div className="manija" />
              </div>
              <figcaption>antes y ahora, deslizando el dedo</figcaption>
            </figure>
            <figure className="obj o7">
              <div className="ticket-mesa">
                <small>VALE POR</small>
                <b>Un almuerzo con vos</b>
                <span>el domingo cocino yo</span>
              </div>
              <figcaption>una raspadita con tu regalo</figcaption>
            </figure>
            <figure className="obj o8">
              <div className="almanaque">
                <span className="mes">OCTUBRE</span>
                <span className="dia">18</span>
                <span className="sem">domingo</span>
              </div>
              <figcaption>si querés, no la puede abrir hasta ese día</figcaption>
            </figure>
          </div>
        </section>

        <section className="como-se-hace envolver" id="como">
          <span className="mancha" aria-hidden="true" />
          <div className="cuaderno">
            <p className="fecha-cuaderno">18 de octubre de 2026</p>
            <h2>Cómo se hace</h2>
            <ol>
              <li>
                Completás lo que tengas: su nombre, una carta, fotos, audios, su canción. Lo único obligatorio es su
                nombre y el tuyo.
              </li>
              <li>Le pasás un link a la familia para que cada uno sume su mensaje.</li>
              <li>Se la mandás por WhatsApp. Si querés, que se abra recién el domingo.</li>
              <li>Ella la abre como un regalo. Y vos te enterás cuándo y qué te contestó.</li>
            </ol>
            <Trazo className="corazon-margen" width={34} height={32} viewBox="0 0 24 22" d={CORAZON_TRAZO} />
          </div>
        </section>

        <section className="enterate envolver">
          <div className="enterate-txt">
            <h2 className="serif">Y te enterás cuando la abre.</h2>
            <p>
              Te avisamos cuándo la abrió, cuántos abrazos te mandó y lo que te contestó. El resto, que te lo cuente el
              domingo.
            </p>
            <p className="nota-mano">pañuelos no incluidos</p>
          </div>
          <div className="acuse">
            <p className="acuse-cab">CARTITA · ACUSE DE RECIBO</p>
            <dl>
              {[
                ['Para', 'Ma'],
                ['Abierta', 'dom 18/10 · 10:32'],
                ['Abrazos', '7'],
                ['Mensajes de la familia', '3'],
              ].map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <i />
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
            <p className="acuse-t">Respuesta:</p>
            <p className="acuse-resp">“Me hiciste llorar. Te amo, hijo.”</p>
            <span className="sello-recibido">RECIBIDO</span>
          </div>
        </section>

        <section className="posdata envolver" id="preguntas">
          <h2 className="serif">Por las dudas</h2>
          <dl className="pd">
            {[
              ['P.D.', '¿Cuánto sale?', 'Nada. Por ahora es gratis.'],
              ['P.P.D.', '¿Ella tiene que bajarse algo?', 'No. Abre el link desde WhatsApp y listo, en iPhone o en Android.'],
              [
                'P.P.P.D.',
                '¿Se la puedo mandar antes del domingo?',
                'Sí. Elegís desde cuándo se puede abrir. Si entra antes, ve cuánto falta y no puede espiar.',
              ],
              ['P.P.P.P.D.', '¿Quién más la puede ver?', 'Solo quien tenga el link. No aparece en Google ni en ningún lado.'],
            ].map(([pd, q, r]) => (
              <div key={pd}>
                <dt>
                  <span>{pd}</span> {q}
                </dt>
                <dd>{r}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="final-portada envolver">
          <p className="mano-grande">¿Y? ¿La armamos?</p>
          <button type="button" className="btn-mano" onClick={empezar}>
            Armar mi carta
          </button>
          <p className="nota-mano">te lleva cinco minutos. a ella le va a durar mucho más.</p>
        </section>

        <footer className="pie-papel envolver">
          <span>Cartita</span>
          <nav aria-label="Pie">
            <a href="#trae" onClick={ir('trae')}>qué lleva</a>
            <a href="#como" onClick={ir('como')}>cómo se hace</a>
            <a href="#preguntas" onClick={ir('preguntas')}>preguntas</a>
          </nav>
          <span>hecho a mano en Argentina · 2026</span>
        </footer>
      </section>

      <div className="barra">
        <div className="dentro">
          <button type="button" className="btn vidrio" onClick={ejemplo}>
            Ver un ejemplo
          </button>
          <button type="button" className="btn" onClick={empezar}>
            Empezar mi carta
          </button>
        </div>
      </div>
    </main>
  )
}
