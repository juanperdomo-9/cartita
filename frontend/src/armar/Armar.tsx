import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link, useNavigate } from 'react-router'
import { crearCarta, publicarCarta, subirArchivoCarta, type CartaCreada, type Rol } from '../api/cartas'
import Escena from '../carta/Escena'
import { ICONO_EQUIS, Marca, copiar, useToast } from '../components/comunes'
import { comprimir, guardarMia, mimeDe, type AudioListo, type FotoLista } from '../lib/archivos'
import { leerCancion, nombreServicio } from '../lib/cancion'
import { esPlural, fechaLinda } from '../lib/texto'
import { tituloVistaPrevia, VISTAS_PREVIAS } from '../lib/vistaPrevia'
import type { OcasionActiva } from '../ocasiones'
import Audios from './Audios'
import {
  abreDesde,
  aCrear,
  aVistaPrevia,
  borrarBorrador,
  cargarBorrador,
  guardarBorrador,
  lineasGracias,
  SIN_FOTOS,
  type Borrador,
  type Fotos,
  type LugarFoto,
} from './borrador'

const NOMBRES = [
  'Para quién es',
  'Cómo empieza',
  'Tu carta',
  'Un recuerdo',
  'Sus fotos',
  'Antes y ahora',
  'Audios',
  'Gracias por…',
  'Su canción',
  'El regalo',
  'Cuándo la abre',
  'Revisá y creá el link',
]
const OPCIONALES = new Set([2, 3, 4, 5, 6, 8])
const TOTAL = NOMBRES.length - 1
const P = { para: 0, cancion: 8, entrega: 10 }

const MAS = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5 9-10" />
  </svg>
)

interface Creacion {
  carta: CartaCreada
  subidos: Set<string>
  publicada: boolean
}

export default function Armar({ ocasion }: { ocasion: OcasionActiva }) {
  const navegar = useNavigate()
  const [b, setB] = useState<Borrador>(() => cargarBorrador(ocasion))
  const [fotos, setFotos] = useState<Fotos>(SIN_FOTOS)
  const [audios, setAudios] = useState<AudioListo[]>([])
  const [paso, setPaso] = useState(0)
  const [errores, setErrores] = useState<Partial<Record<'para' | 'de' | 'fecha', string>>>({})
  const [previa, setPrevia] = useState(false)
  const [estado, setEstado] = useState('')
  const [creando, setCreando] = useState(false)
  const [lista, setLista] = useState<CartaCreada | null>(null)
  const creacion = useRef<Creacion | null>(null)
  const [toast, avisar] = useToast()
  const titulo = useRef<HTMLHeadingElement>(null)
  const resultado = useRef<HTMLDivElement>(null)

  useEffect(() => guardarBorrador(ocasion, b), [b, ocasion])
  useEffect(() => {
    window.scrollTo(0, 0)
    titulo.current?.focus({ preventScroll: true })
  }, [paso])

  // Si cambia algo después de crear el link, el próximo "Crear mi link" arma otra carta.
  const cambiar = <K extends keyof Borrador>(k: K, v: Borrador[K]) => {
    setB((x) => ({ ...x, [k]: v }))
    setErrores((e) => ({ ...e, [k]: undefined }))
    olvidarCreacion()
  }
  const olvidarCreacion = () => {
    if (creacion.current?.publicada) creacion.current = null
    setLista(null)
  }
  const ponerFoto = (k: LugarFoto, f: FotoLista | null) => {
    setFotos((x) => ({ ...x, [k]: f }))
    olvidarCreacion()
  }

  // Terminar: se borra el borrador y vuelve a la portada (la carta queda en "Tus cartas").
  const terminar = () => {
    borrarBorrador(ocasion)
    navegar(ocasion.ruta)
  }

  const cancion = leerCancion(b.cancion)
  const cancionError = cancion && 'error' in cancion ? cancion.error : ''
  const gracias = lineasGracias(b.gracias)
  const plural = esPlural(b.de)

  const valido = (n: number) => {
    if (n === P.para) {
      if (!b.para.trim()) return setErrores({ para: 'Contanos cómo le decís.' }), false
      if (!b.de.trim()) return setErrores({ de: 'Poné quién la firma.' }), false
    }
    if (n === P.cancion && cancionError) return false
    if (n === P.entrega && b.entrega === 'otra') {
      if (!b.fecha) return setErrores({ fecha: 'Elegí el día y la hora.' }), false
      if (new Date(b.fecha) <= new Date()) return setErrores({ fecha: 'Esa fecha ya pasó.' }), false
    }
    return true
  }

  const derecha = () => {
    if (paso < TOTAL) {
      if (valido(paso)) setPaso(paso + 1)
      return
    }
    crearLink()
  }

  const archivosPendientes = () => {
    const l: { clave: string; blob: Blob; pedido: Parameters<typeof subirArchivoCarta>[2] }[] = []
    ;(['principal', 'p0', 'p1', 'p2', 'antes', 'ahora'] as const).forEach((k) => {
      const f = fotos[k]
      if (f)
        l.push({ clave: k, blob: f.blob, pedido: { tipo: 'foto', rol: k as Rol, mime: 'image/jpeg', bytes: f.blob.size, ancho: f.ancho, alto: f.alto } })
    })
    fotos.pila.forEach((f, i) =>
      l.push({
        clave: 'pila' + i,
        blob: f.blob,
        pedido: { tipo: 'foto', rol: 'pila', orden: i, mime: 'image/jpeg', bytes: f.blob.size, ancho: f.ancho, alto: f.alto },
      }),
    )
    audios.forEach((a, i) =>
      l.push({
        clave: 'audio' + i,
        blob: a.blob,
        pedido: {
          tipo: 'audio',
          rol: 'audio_autor',
          orden: i,
          mime: mimeDe(a.blob),
          bytes: a.blob.size,
          duracion_seg: a.seg,
          quien: a.quien.trim().slice(0, 30),
        },
      }),
    )
    return l
  }

  const crearLink = async () => {
    if (creacion.current?.publicada) {
      setLista(creacion.current.carta)
      return
    }
    setCreando(true)
    setEstado('Guardando tu carta…')
    try {
      if (!creacion.current) {
        const carta = await crearCarta(aCrear(b, ocasion))
        creacion.current = { carta, subidos: new Set(), publicada: false }
      }
      const c = creacion.current
      const pendientes = archivosPendientes()
      const fotosN = pendientes.filter((x) => x.pedido.tipo === 'foto').length
      let i = 0
      for (const p of pendientes) {
        i++
        if (c.subidos.has(p.clave)) continue
        setEstado(
          p.pedido.tipo === 'foto'
            ? `Guardando fotos (${i} de ${fotosN})…`
            : `Guardando audios (${i - fotosN} de ${pendientes.length - fotosN})…`,
        )
        await subirArchivoCarta(c.carta, p.blob, p.pedido)
        c.subidos.add(p.clave)
      }
      await publicarCarta(c.carta.id, c.carta.token_admin)
      c.publicada = true
      guardarMia({ token: c.carta.token_admin, slug: c.carta.slug, para: b.para.trim(), creada: Date.now() })
      setLista(c.carta)
      setEstado('')
      requestAnimationFrame(() => resultado.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (e) {
      setEstado((e instanceof Error ? e.message : 'No se pudo guardar.') + ' Tocá “Crear mi link” para reintentar.')
    } finally {
      setCreando(false)
    }
  }

  // La vista previa se arma al abrirla; el estilo lo cambia el motor sin rearmarla.
  const [vista, setVista] = useState<ReturnType<typeof aVistaPrevia> | null>(null)
  const abrirPrevia = () => {
    setVista(aVistaPrevia(b, ocasion, fotos, audios))
    setPrevia(true)
  }

  // ---------- piezas ----------
  const sugerencias = (campo: 'para' | 'titulo' | 'subtitulo' | 'regaloTitulo' | 'regaloDetalle', lista: string[]) => (
    <div className="sugerencias">
      {lista.map((t) => (
        <button type="button" key={t} className={'sug' + (b[campo].trim() === t ? ' puesta' : '')} onClick={() => cambiar(campo, t)}>
          {t}
        </button>
      ))}
    </div>
  )

  const subir = (k: LugarFoto, texto: string, grande = false) => {
    const f = fotos[k]
    return (
      <label
        className={'subir' + (grande ? ' grande' : '') + (f ? ' con-foto' : '')}
        style={f ? { backgroundImage: `url("${f.url}")` } : undefined}
      >
        {grande ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 17l-5-5-9 7" />
          </svg>
        ) : (
          MAS
        )}
        {texto}
        <input
          type="file"
          accept="image/*"
          aria-label={texto}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) comprimir(file).then((x) => ponerFoto(k, x), () => avisar('No pudimos leer esa foto. Probá con otra.'))
          }}
        />
      </label>
    )
  }

  const encabezado = (h: ReactNode, explica: string, donde?: string) => (
    <header>
      <h2 className="titulo" ref={titulo} tabIndex={-1}>
        {h}
      </h2>
      <p className="explica">{explica}</p>
      {donde && <span className="donde">{donde}</span>}
    </header>
  )

  const pasos: ReactNode[] = [
    // 0. Para quién es
    <>
      {encabezado(<>¿Para <em>quién</em> es?</>, "Arrancamos por lo básico: cómo le decís y quién la firma.", "Aparece en el sobre y al final de la carta")}
      <div className={'campo' + (errores.para ? ' error' : '')}>
        <label htmlFor="f-para">¿Cómo le decís?</label>
        <input type="text" id="f-para" maxLength={20} placeholder={ocasion.textos.paraPlaceholder} value={b.para} onChange={(e) => cambiar('para', e.target.value)} />
        {sugerencias('para', ocasion.sugerencias.para)}
        <p className="msg">{errores.para}</p>
      </div>
      <div className={'campo' + (errores.de ? ' error' : '')}>
        <label htmlFor="f-de">¿Quién la firma?</label>
        <input type="text" id="f-de" maxLength={50} placeholder="Tu nombre" value={b.de} onChange={(e) => cambiar('de', e.target.value)} />
        <p className="ayuda">Si la firman varios, ponelos así: Sofi, Juan y Tomi. La carta se adapta y habla en plural.</p>
        <p className="msg">{errores.de}</p>
      </div>
      {ocasion.contador && (
        <div className="campo">
          <label htmlFor="f-desde">
            {ocasion.contador.label}
            <span className="opc">opcional</span>
          </label>
          <input
            type="date"
            id="f-desde"
            max={new Date().toISOString().slice(0, 10) < ocasion.contador.max ? new Date().toISOString().slice(0, 10) : ocasion.contador.max}
            value={b.desde}
            onChange={(e) => cambiar('desde', e.target.value)}
          />
          <p className="ayuda">{ocasion.contador.ayuda}</p>
        </div>
      )}
    </>,

    // 1. Cómo empieza
    <>
      {encabezado(<>¿Cómo <em>empieza?</em></>, "Es lo primero que lee cuando abre el sobre, en letras grandes. Corto y desde el corazón.", "Primera pantalla después del sobre")}
      <div className="campo">
        <label htmlFor="f-titulo">Primera frase</label>
        <input type="text" id="f-titulo" maxLength={70} placeholder={ocasion.textos.tituloPlaceholder} value={b.titulo} onChange={(e) => cambiar('titulo', e.target.value)} />
        {sugerencias('titulo', ocasion.sugerencias.titulo)}
        <div className="pie-campo">
          <span className="cuenta">{b.titulo.length} / 70</span>
        </div>
      </div>
      <div className="campo">
        <label htmlFor="f-subtitulo">
          Segunda frase<span className="opc">opcional</span>
        </label>
        <input type="text" id="f-subtitulo" maxLength={60} placeholder="Así que te armé esto." value={b.subtitulo} onChange={(e) => cambiar('subtitulo', e.target.value)} />
        {sugerencias('subtitulo', ocasion.sugerencias.subtitulo)}
      </div>
      <div className="campo">
        <span className="lbl">Estilo de la carta</span>
        <div className="estilos">
          {(
            [
              ['papel', 'Papel', 'Claro, como una carta de verdad'],
              ['bordo', 'Bordó', 'Oscuro y elegante'],
            ] as const
          ).map(([v, n, d]) => (
            <label className="estilo-op" key={v}>
              <input type="radio" name="estilo" value={v} checked={b.estilo === v} onChange={() => cambiar('estilo', v)} />
              <span className={'muestra-estilo ' + v}>
                <span>
                  {ocasion.textos.paraDefecto}, esto es <em>para vos</em>
                </span>
                <i />
              </span>
              <b>{n}</b>
              <small>{d}</small>
            </label>
          ))}
        </div>
      </div>
    </>,

    // 2. Tu carta
    <>
      {encabezado(<>Tu <em>carta</em></>, "Escribile como le hablarías. Sale en una hoja escrita a mano y ella la lee a su ritmo: no pasa sola.", "Una hoja de carta, después de la primera frase")}
      <div className="campo">
        <label htmlFor="f-carta">Lo que le querés decir</label>
        <textarea id="f-carta" maxLength={700} placeholder={ocasion.textos.cartaPlaceholder} value={b.carta} onChange={(e) => cambiar('carta', e.target.value)} />
        <div className="pie-campo">
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              if (b.carta.trim()) return
              cambiar('carta', ocasion.textos.ejemploCarta(b.para.trim() || ocasion.textos.paraDefecto, plural))
              document.getElementById('f-carta')?.focus()
            }}
          >
            Empezar con un ejemplo
          </button>
          <span className="cuenta">{b.carta.length} / 700</span>
        </div>
      </div>
      <div className="consejo">
        <b>¿No sabés por dónde arrancar?</b>
        <ol>
          <li>Algo que te enseñó y usás todos los días.</li>
          <li>Algo que nunca le agradeciste.</li>
          <li>Algo que te gustaría hacer con ella este año.</li>
        </ol>
      </div>
    </>,

    // 3. Un recuerdo
    <>
      {encabezado(<>Un <em>recuerdo</em></>, "Elegí una foto que le guste y contá en una frase qué pasó ese día. Vertical u horizontal, sale entera.", "Foto grande con tu frase encima")}
      {subir('principal', 'Tocá para subir la foto', true)}
      <div className="dos">
        <div className="campo">
          <label htmlFor="f-lugar">¿Dónde y cuándo?</label>
          <input type="text" id="f-lugar" maxLength={40} placeholder="Mar del Plata, 1998" value={b.lugar} onChange={(e) => cambiar('lugar', e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="f-recuerdo">¿Qué pasó?</label>
          <input type="text" id="f-recuerdo" maxLength={90} placeholder="La sombrilla se voló. Vos te reíste igual." value={b.recuerdo} onChange={(e) => cambiar('recuerdo', e.target.value)} />
        </div>
      </div>
    </>,

    // 4. Sus fotos
    <>
      {encabezado(<>Sus <em>fotos</em></>, "Las tres primeras caen como polaroids, con un textito escrito a mano. Las demás se van apilando una arriba de la otra, enteras, como fotos sobre una mesa.", "Polaroids y pila de fotos")}
      <div className="tres">
        {(['p0', 'p1', 'p2'] as const).map((k, i) => {
          const campo = ('pc' + i) as 'pc0' | 'pc1' | 'pc2'
          return (
            <div className="campo" key={k}>
              {subir(k, 'Foto ' + (i + 1))}
              <input type="text" maxLength={20} placeholder="Texto" aria-label={'Texto de la polaroid ' + (i + 1)} value={b[campo]} onChange={(e) => cambiar(campo, e.target.value)} />
            </div>
          )
        })}
      </div>
      <div className="campo">
        <span className="lbl">
          Pila de fotos<span className="opc">hasta 6</span>
        </span>
        <div className="galeria-armar">
          {fotos.pila.map((f, i) => (
            <div className="mini" key={f.url} style={{ backgroundImage: `url("${f.url}")` }}>
              <button
                type="button"
                aria-label={'Quitar foto ' + (i + 1)}
                onClick={() => {
                  setFotos((x) => ({ ...x, pila: x.pila.filter((_, k) => k !== i) }))
                  olvidarCreacion()
                }}
              >
                {ICONO_EQUIS}
              </button>
            </div>
          ))}
        </div>
        {fotos.pila.length < 6 && (
          <label className="btn vidrio boton-archivo">
            Sumar fotos
            <input
              type="file"
              accept="image/*"
              multiple
              aria-label="Sumar fotos a la pila"
              onChange={async (e) => {
                const archivos = [...(e.target.files || [])].slice(0, 6 - fotos.pila.length)
                e.target.value = ''
                for (const file of archivos) {
                  try {
                    const f = await comprimir(file)
                    setFotos((x) => (x.pila.length < 6 ? { ...x, pila: [...x.pila, f] } : x))
                  } catch {
                    avisar('No pudimos leer una de las fotos.')
                  }
                }
                olvidarCreacion()
              }}
            />
          </label>
        )}
      </div>
    </>,

    // 5. Antes y ahora
    <>
      {encabezado(<>Antes y <em>ahora</em></>, "Dos fotos en la misma pose: una vieja y una de hoy. Ella desliza el dedo para pasar de una a la otra.", "Una foto que se transforma en la otra")}
      <div className="par">
        <div className="campo">
          {subir('antes', 'Foto de antes')}
          <input type="text" maxLength={16} placeholder="1998" aria-label="Texto de la foto de antes" value={b.antesTxt} onChange={(e) => cambiar('antesTxt', e.target.value)} />
        </div>
        <div className="campo">
          {subir('ahora', 'Foto de ahora')}
          <input type="text" maxLength={16} placeholder="Hoy" aria-label="Texto de la foto de ahora" value={b.ahoraTxt} onChange={(e) => cambiar('ahoraTxt', e.target.value)} />
        </div>
      </div>
      <div className="consejo">
        <b>Para que quede bien</b>
        <ol>
          <li>Que se parezcan: mismo lugar, misma pose o la misma gente.</li>
          <li>Las dos en vertical, si se puede.</li>
          <li>¿No tenés la de hoy? Es la excusa para sacarla el domingo.</li>
        </ol>
      </div>
    </>,

    // 6. Audios
    <>
      {encabezado(<>Mensajes de <em>voz</em></>, "Grabá o subí audios tuyos o de la familia. Ella los escucha en la carta, como en WhatsApp. Escuchar una voz pega distinto.", "Pantalla “Te dejaron mensajes”")}
      <Audios
        audios={audios}
        onCambio={(a) => {
          setAudios(a)
          olvidarCreacion()
        }}
        max={4}
        conNombre
        onError={avisar}
      />
      <div className="consejo">
        <b>Cómo grabarlo</b>
        <ol>
          <li>Tocá “Grabar un audio” y hablá cerca del celular.</li>
          <li>Que dure menos de un minuto.</li>
          <li>Si ya lo tenés grabado, subilo y poné de quién es.</li>
        </ol>
      </div>
      <p className="ayuda">{ocasion.textos.audiosAyuda}</p>
    </>,

    // 7. Gracias por…
    <>
      {encabezado(<>Gracias <em>por…</em></>, "Cosas chiquitas y bien de ella. Van pasando una por una, en letras grandes.", "Pantalla de “Gracias por…”")}
      <div className="campo">
        <label htmlFor="f-gracias">Una por línea, hasta 6</label>
        <textarea id="f-gracias" maxLength={360} style={{ minHeight: 170 }} placeholder={ocasion.textos.graciasPlaceholder} value={b.gracias} onChange={(e) => cambiar('gracias', e.target.value)} />
        <p className="ayuda">Tocá una idea para sumarla:</p>
        <div className="sugerencias">
          {ocasion.sugerencias.gracias.map((t) => (
            <button
              type="button"
              key={t}
              className={'sug' + (gracias.includes(t) ? ' puesta' : '')}
              onClick={() => {
                if (gracias.includes(t) || gracias.length >= 6) return
                cambiar('gracias', gracias.concat(t).join('\n'))
              }}
            >
              + {t}
            </button>
          ))}
        </div>
      </div>
    </>,

    // 8. Su canción
    <>
      {encabezado(<>Su <em>canción</em></>, "Elegí el tema que te hace acordar a ella. Aparece en un disco y ella le da play antes de seguir leyendo.", "Suena mientras recorre la carta")}
      <div className={'campo' + (cancionError ? ' error' : '')}>
        <label htmlFor="f-cancion">Link de YouTube o Spotify</label>
        <input type="url" id="f-cancion" inputMode="url" placeholder="Pegá el link acá" value={b.cancion} onChange={(e) => cambiar('cancion', e.target.value)} />
        <p className={'msg' + (cancion && !cancionError ? ' ok' : '')}>
          {!cancion ? '' : cancionError || 'Listo: canción de ' + nombreServicio(cancion as Exclude<typeof cancion, { error: string }>) + '.'}
        </p>
        {cancion && !cancionError && 'tipo' in cancion && cancion.tipo === 'spotify' && (
          <p className="ayuda">
            Ojo: si ella no tiene Spotify abierto en el celular, Spotify deja escuchar solo 30 segundos. Con un link de
            YouTube suena el tema entero durante toda la carta.
          </p>
        )}
      </div>
      <div className="consejo">
        <b>Cómo copiar el link</b>
        <ol>
          <li>Buscá el tema en YouTube o en Spotify.</li>
          <li>
            Tocá <strong>Compartir</strong> y después <strong>Copiar link</strong>.
          </li>
          <li>Volvé acá y pegalo.</li>
        </ol>
      </div>
      <div className="campo">
        <label htmlFor="f-cancion-nombre">
          ¿Cómo la mostramos?<span className="opc">opcional</span>
        </label>
        <input type="text" id="f-cancion-nombre" maxLength={50} placeholder="El tema que cantábamos en el auto" value={b.cancionNombre} onChange={(e) => cambiar('cancionNombre', e.target.value)} />
        <p className="ayuda">Puede ser el nombre del tema o una frase tuya. Si no ponés ningún link, suena una cajita de música.</p>
      </div>
    </>,

    // 9. El regalo
    <>
      {encabezado(<>El <em>regalo</em></>, "Al final, ella raspa con el dedo una tarjeta y descubre lo que le regalás. Puede ser algo simple: un plan juntos vale oro.", "Raspadita de la última pantalla")}
      <div className="campo">
        <label htmlFor="f-rt">Vale por…</label>
        <input type="text" id="f-rt" maxLength={36} placeholder="Un almuerzo con vos" value={b.regaloTitulo} onChange={(e) => cambiar('regaloTitulo', e.target.value)} />
        {sugerencias('regaloTitulo', ocasion.sugerencias.regaloTitulo)}
      </div>
      <div className="campo">
        <label htmlFor="f-rd">
          Un detalle<span className="opc">opcional</span>
        </label>
        <input type="text" id="f-rd" maxLength={50} placeholder="el domingo cocino yo" value={b.regaloDetalle} onChange={(e) => cambiar('regaloDetalle', e.target.value)} />
        {sugerencias('regaloDetalle', ocasion.sugerencias.regaloDetalle)}
      </div>
    </>,

    // 10. Cuándo la abre
    <>
      {encabezado(<>¿Cuándo la <em>abre?</em></>, "Podés mandársela antes y que no la pueda abrir hasta el día. Si entra antes, ve una cuenta regresiva.", "Si entra antes de tiempo, ve cuánto falta")}
      <div className="opciones">
        <label className="opcion">
          <input type="radio" name="entrega" checked={b.entrega === 'ya'} onChange={() => cambiar('entrega', 'ya')} />
          <span>
            <b>Apenas le llegue</b>
            <small>La puede abrir cuando quiera.</small>
          </span>
        </label>
        {ocasion.apertura && Date.parse(ocasion.apertura.iso) > Date.now() && (
          <label className="opcion">
            <input type="radio" name="entrega" checked={b.entrega === 'dia'} onChange={() => cambiar('entrega', 'dia')} />
            <span>
              <b>{ocasion.apertura.titulo}</b>
              <small>{ocasion.apertura.detalle}</small>
            </span>
          </label>
        )}
        <label className="opcion">
          <input type="radio" name="entrega" checked={b.entrega === 'otra'} onChange={() => cambiar('entrega', 'otra')} />
          <span>
            <b>Otro día y hora</b>
            <small>Elegilo vos.</small>
          </span>
        </label>
      </div>
      {b.entrega === 'otra' && (
        <div className={'campo' + (errores.fecha ? ' error' : '')}>
          <label htmlFor="f-fecha">Día y hora</label>
          <input type="datetime-local" id="f-fecha" value={b.fecha} onChange={(e) => cambiar('fecha', e.target.value)} />
          <p className="msg">{errores.fecha}</p>
        </div>
      )}
      <div className="campo">
        <span className="lbl">¿Qué ve cuando le llega el link?</span>
        <p className="ayuda">
          Es lo que muestra WhatsApp abajo del link. Nunca dice su nombre ni que es un regalo: así no le arruinás la sorpresa.
        </p>
        <div className="sugerencias">
          {VISTAS_PREVIAS.map((v) => (
            <button
              type="button"
              key={v.clave}
              className={'sug' + (b.vistaPrevia === v.clave ? ' puesta' : '')}
              aria-pressed={b.vistaPrevia === v.clave}
              onClick={() => cambiar('vistaPrevia', v.clave)}
            >
              {v.titulo}
            </button>
          ))}
        </div>
      </div>
    </>,

    // 11. Revisá y creá el link
    <>
      {encabezado(<>¡Ya <em>casi!</em></>, "Revisá que esté todo. Mirá cómo queda y, cuando te guste, creá el link.")}
      <Resumen b={b} fotos={fotos} audios={audios} ocasion={ocasion} irPaso={setPaso} />
      <p className="estado" aria-live="polite">
        {estado}
      </p>
      {lista && <Resultado carta={lista} b={b} ocasion={ocasion} refe={resultado} onTerminar={terminar} />}
    </>,
  ]

  const n = paso
  return (
    <>
      <main className="armar" hidden={previa}>
        <Marca etiqueta={ocasion.etiqueta} logoA={ocasion.ruta} />
        <div className="cabecera">
          <div className="cab-fila">
            <button className="atras" type="button" aria-label="Paso anterior" onClick={() => (n === 0 ? navegar(ocasion.ruta) : setPaso(n - 1))}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <div className="cab-texto">
              <small>{n < TOTAL ? 'Paso ' + (n + 1) + ' de ' + TOTAL + (OPCIONALES.has(n) ? ' · opcional' : '') : 'Último paso'}</small>
              <b>{NOMBRES[n]}</b>
            </div>
          </div>
          <div className="progreso" aria-hidden="true">
            {Array.from({ length: TOTAL }, (_, i) => (
              <i key={i} className={i <= n ? 'ok' : ''} />
            ))}
          </div>
        </div>
        <form autoComplete="off" noValidate onSubmit={(e) => e.preventDefault()}>
          <section className="paso">{pasos[n]}</section>
        </form>
        {toast}
        <div className="barra">
          <div className="dentro">
            <button type="button" className="btn vidrio" onClick={abrirPrevia}>
              Ver cómo queda
            </button>
            <button
              type="button"
              className={'btn' + (n === TOTAL ? ' rosa' : '')}
              onClick={n === TOTAL && lista ? terminar : derecha}
              disabled={creando}
            >
              {n < TOTAL ? (n === TOTAL - 1 ? 'Revisar' : 'Siguiente') : lista ? 'Terminar' : 'Crear mi link'}
            </button>
          </div>
        </div>
      </main>
      {previa && vista && (
        <Escena
          datos={vista}
          modo="previa"
          onCerrar={() => setPrevia(false)}
          onEstilo={(v) => setB((x) => ({ ...x, estilo: v }))}
        />
      )}
    </>
  )
}

function Resumen({
  b,
  fotos,
  audios,
  ocasion,
  irPaso,
}: {
  b: Borrador
  fotos: Fotos
  audios: AudioListo[]
  ocasion: OcasionActiva
  irPaso: (n: number) => void
}) {
  const nPolas = (['p0', 'p1', 'p2'] as const).filter((k) => fotos[k]).length
  const g = lineasGracias(b.gracias).slice(0, 6)
  const c = leerCancion(b.cancion)
  const cancion = c && !('error' in c) ? c : null
  const abre = abreDesde(b, ocasion)
  const para = b.para.trim() || ocasion.textos.paraDefecto
  const filas: [boolean, string, string][] = [
    [true, 'Para quién es', 'Para ' + para + ', de ' + (b.de.trim() || 'Tu hijo')],
    [!!b.titulo.trim(), 'Cómo empieza', (b.titulo.trim() || 'Usamos una frase de ejemplo') + ' · estilo ' + (b.estilo === 'bordo' ? 'Bordó' : 'Papel')],
    [!!b.carta.trim(), 'Tu carta', b.carta.trim() ? b.carta.trim().split(/\s+/).length + ' palabras' : 'Sin carta: esa parte se saltea'],
    [
      !!(fotos.principal || b.recuerdo.trim()),
      'Un recuerdo',
      fotos.principal
        ? 'Con foto' + (b.recuerdo.trim() ? ' y frase' : '')
        : b.recuerdo.trim()
          ? 'Sin foto (usamos una ilustración)'
          : 'Vacío: esa parte se saltea',
    ],
    [
      nPolas + fotos.pila.length > 0,
      'Sus fotos',
      nPolas + fotos.pila.length ? nPolas + ' polaroids' + (fotos.pila.length ? ' y ' + fotos.pila.length + ' en la pila' : '') : 'Sin fotos todavía',
    ],
    [
      !!(fotos.antes && fotos.ahora),
      'Antes y ahora',
      fotos.antes && fotos.ahora ? 'Las dos fotos listas' : fotos.antes || fotos.ahora ? 'Falta una de las dos fotos' : 'Vacío: esa parte se saltea',
    ],
    [audios.length > 0, 'Audios', audios.length ? audios.length + (audios.length === 1 ? ' audio' : ' audios') : 'Sin audios (la familia puede sumar)'],
    [g.length > 0, 'Gracias por…', g.length ? g.length + (g.length === 1 ? ' frase' : ' frases') : 'Vacío: esa parte se saltea'],
    [!!cancion, 'Su canción', cancion ? nombreServicio(cancion) + (b.cancionNombre.trim() ? ' · ' + b.cancionNombre.trim() : '') : 'Cajita de música'],
    [
      !!b.regaloTitulo.trim(),
      'El regalo',
      b.regaloTitulo.trim() ? 'Vale por ' + b.regaloTitulo.trim().charAt(0).toLowerCase() + b.regaloTitulo.trim().slice(1) : 'Un abrazo enorme (de ejemplo)',
    ],
    [
      true,
      'Cuándo la abre',
      (abre ? 'Desde el ' + fechaLinda(abre) : 'Apenas le llegue') + ' · en WhatsApp dice “' + tituloVistaPrevia(b.vistaPrevia) + '”',
    ],
  ]
  return (
    <ul className="resumen">
      {filas.map((f, i) => (
        <li key={f[1]}>
          <span className={'ic' + (f[0] ? ' si' : '')}>{f[0] ? CHECK : null}</span>
          <div>
            <b>{f[1]}</b>
            <span>{f[2]}</span>
          </div>
          <button type="button" onClick={() => irPaso(i)}>
            Editar
          </button>
        </li>
      ))}
    </ul>
  )
}

function LinkCopiable({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  const nodo = useRef<HTMLElement>(null)
  return (
    <div className="link">
      <code ref={nodo}>{texto}</code>
      <button
        type="button"
        onClick={async () => {
          if (await copiar(texto, nodo.current)) {
            setOk(true)
            setTimeout(() => setOk(false), 1500)
          }
        }}
      >
        {ok ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

function Resultado({
  carta,
  b,
  ocasion,
  refe,
  onTerminar,
}: {
  carta: CartaCreada
  b: Borrador
  ocasion: OcasionActiva
  refe: RefObject<HTMLDivElement | null>
  onTerminar: () => void
}) {
  const base = location.origin
  const link = base + '/c/' + carta.slug,
    fam = base + '/s/' + carta.token_familia,
    seg = '/e/' + carta.token_admin
  const para = b.para.trim()
  const msg = ocasion.textos.mensajeElla(para, esPlural(b.de), link)
  return (
    <div className="resultado" ref={refe}>
      <h3>¡Lista tu carta!</h3>
      <div className="bloque-link">
        <h4>1. Pasale este link a la familia</h4>
        <p className="nota">Así cada uno suma su mensaje, una foto o un audio. Aparecen solos en la carta, aunque ella ya la tenga.</p>
        <LinkCopiable texto={fam} />
        <a
          className="btn chico oscuro"
          href={'https://wa.me/?text=' + encodeURIComponent(ocasion.textos.mensajeFamilia(para, fam))}
          target="_blank"
          rel="noopener"
          style={{ justifySelf: 'start' }}
        >
          Mandar al grupo de la familia
        </a>
      </div>
      <div className="bloque-link">
        <h4>2. Mandale la carta a ella</h4>
        <LinkCopiable texto={link} />
        <p className="mensaje">{msg}</p>
        <a className="btn chico rosa" href={'https://wa.me/?text=' + encodeURIComponent(msg)} target="_blank" rel="noopener" style={{ justifySelf: 'start' }}>
          Mandar por WhatsApp
        </a>
      </div>
      <div className="bloque-link">
        <h4>3. Mirá cómo le cayó</h4>
        <p className="nota">
          Ahí vas a ver cuándo la abrió, sus abrazos, su respuesta y quién de la familia escribió. También queda en la portada, en
          “Tus cartas”.
        </p>
        <Link className="btn chico oscuro" to={seg} style={{ justifySelf: 'start' }}>
          Ver cómo le cayó
        </Link>
        <LinkCopiable texto={base + seg} />
        <p className="aviso-token">
          Guardate este último link (por ejemplo, mandátelo a vos por WhatsApp). Es la única forma de ver el seguimiento: si
          borrás los datos del navegador o cambiás de celular, sin él lo perdés.
        </p>
      </div>
      <div className="bloque-link">
        <p className="nota">¿Ya mandaste todo? Terminá y volvé al inicio: la carta queda guardada en “Tus cartas”.</p>
        <button type="button" className="btn chico rosa" style={{ justifySelf: 'start' }} onClick={onTerminar}>
          Terminar
        </button>
      </div>
    </div>
  )
}
