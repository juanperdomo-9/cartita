// Motor de la carta: sobre, historia, raspadita y final. Portado del prototipo (sección
// "LA CARTA"), con los mismos nombres de funciones para poder compararlos.
// Diferencias con el prototipo: el contenido llega de la API (links firmados), los eventos se
// avisan con `onEvento`, la cuenta regresiva usa la hora del servidor y la canción usa el
// reproductor real de YouTube o Spotify (EMBEBER = true).

import { embedCancion } from '../lib/cancion'
import { azar, fuenteMuestra, imagenMuestra, ramoSVG, type Muestra } from '../lib/muestras'
import { esPlural, fechaLinda, marcar, mmss } from '../lib/texto'
import { ocasionActiva, type OcasionActiva, type Voces } from '../ocasiones'
import { ESQUELETO } from './esqueleto'
import type { AudioCarta, CartaEnEspera, CartaVista, Estilo, EventoCarta, Foto, ModoCarta } from './tipos'

const EMBEBER = true

const CORAZON =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>'
const PLAY =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>'
const PAUSA =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'
const MUESTRA_GAL: Muestra[] = ['luces', 'mar', 'sierras', 'ventana', 'flores', 'noche']
const FORMA_GAL = [
  [400, 500],
  [600, 420],
  [400, 520],
  [560, 400],
  [420, 520],
  [600, 400],
]
const NOTAS = [
  523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 493.88, 587.33, 783.99, 987.77, 783.99, 587.33, 440, 523.25,
  659.25, 880, 659.25, 523.25, 349.23, 440, 523.25, 698.46, 523.25, 440,
]

export interface OpcionesMotor {
  modo: ModoCarta
  /** Diferencia entre la hora del servidor y la del celular (ms) */
  desfase?: number
  onEvento?: (e: EventoCarta) => void
  onCerrar?: () => void
  onEstilo?: (estilo: Estilo) => void
  /** Solo en el link de ella: la cuenta llegó a cero y hay que pedir la carta de nuevo */
  onRecargar?: () => void
}

type Slide = HTMLElement & { _pila?: () => boolean }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, clase?: string, texto?: string | null) {
  const e = document.createElement(tag)
  if (clase) e.className = clase
  if (texto != null) e.textContent = texto
  return e
}

function palabras(tag: 'h2' | 'p', clase: string, texto: string, base: number) {
  const e = el(tag, 'palabras ' + (clase || ''))
  let cursiva = false
  String(texto || '')
    .split(' ')
    .forEach((w, i) => {
      if (!w) return
      const abre = w.startsWith('*'),
        cierra = w.endsWith('*') && w.length > 1
      if (abre) cursiva = true
      const s = el('span', 'w' + (cursiva ? ' em' : ''), w.replace(/\*/g, ''))
      s.style.animationDelay = (base + i * 0.11).toFixed(2) + 's'
      e.append(s, ' ')
      if (cierra) cursiva = false
    })
  return e
}

function conCursiva(nodo: HTMLElement, texto: string) {
  nodo.textContent = ''
  String(texto)
    .split(/\*(.+?)\*/)
    .forEach((parte, i) => {
      if (parte) nodo.append(i % 2 ? el('em', '', parte) : parte)
    })
}

const imagen = (foto: Foto | null | undefined, muestra: Muestra) =>
  foto ? `url("${foto.url.replace(/"/g, '%22')}")` : imagenMuestra(muestra)
const fuente = (foto: Foto | null | undefined, muestra: Muestra | undefined, w: number, h: number) =>
  foto ? foto.url : fuenteMuestra(muestra || 'flores', w, h)

function cargarImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const i = new Image()
    if (/^https?:/.test(src)) i.crossOrigin = 'anonymous'
    i.onload = () => ok(i)
    i.onerror = () => ok(null)
    i.src = src
  })
}

export class MotorCarta {
  private root: HTMLElement
  private op: OpcionesMotor
  private reduce: boolean
  private carta: CartaVista | null = null
  private espera: CartaEnEspera | null = null
  private ocasion: OcasionActiva
  private voz!: Voces
  private limpiezas: (() => void)[] = []
  private timers = new Set<number>()

  // historia
  private actual = 0
  private slides: Slide[] = []
  private temporizador: number | null = null
  private restante = 0
  private inicioT = 0
  private frasesTimer = 0
  private contadorAnim = 0
  private pilaTimer = 0
  private presion = 0
  private retenido = false
  // sonido
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private muda = false
  private bucle = 0
  private sonando: HTMLElement | null = null
  private finAudio = 0
  private reproductor: HTMLAudioElement | null = null
  // raspadita y final
  private c2d: CanvasRenderingContext2D | null = null
  private raspando = false
  private descubierta = false
  private toques = 0
  private abrazos = 0
  private abrazosMandados = 0
  private abrazoT = 0
  private esperaTimer = 0
  private imagenBlob: Blob | null = null

  constructor(root: HTMLElement, datos: CartaVista | CartaEnEspera, op: OpcionesMotor) {
    this.root = root
    this.op = op
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.ocasion = ocasionActiva(datos.ocasion)
    root.innerHTML = ESQUELETO
    root.classList.add('escena')
    root.classList.toggle('previa', op.modo !== 'link')
    this.$('cerrar').setAttribute('aria-label', op.modo === 'previa' ? 'Volver a editar' : 'Volver')
    this.$('pie').hidden = op.modo !== 'link'
    this.$('pie-link').setAttribute('href', this.ocasion.ruta)
    this.$('estilo-switch').hidden = op.modo === 'link'
    this.$('s-eyebrow').textContent = this.ocasion.textos.eyebrow
    this.$('ramo').innerHTML = ramoSVG()
    this.petalos()
    this.conectar()

    if ('fotos' in datos) {
      this.armar(datos)
      if (this.esperaHasta()) this.mostrarEspera(op.modo !== 'link')
      else this.ir('p-sobre')
    } else {
      this.espera = datos
      this.ponerEstilo(datos.estilo)
      this.voz = this.ocasion.voces(esPlural(datos.de))
      this.mostrarEspera(false)
    }
    if (op.modo === 'link') op.onEvento?.({ tipo: 'visto' })
  }

  destruir() {
    this.timers.forEach((t) => clearTimeout(t))
    if (this.temporizador) clearTimeout(this.temporizador)
    clearInterval(this.frasesTimer)
    clearInterval(this.pilaTimer)
    clearInterval(this.esperaTimer)
    cancelAnimationFrame(this.contadorAnim)
    this.mandarAbrazos()
    this.pararMusica()
    this.pararAudio()
    this.ctx?.close().catch(() => {})
    this.limpiezas.forEach((f) => f())
    this.root.innerHTML = ''
  }

  // ---------- utilidades ----------
  private $<T extends HTMLElement = HTMLElement>(id: string): T {
    return this.root.querySelector('#' + id) as T
  }
  private despues(ms: number, f: () => void) {
    const t = window.setTimeout(() => {
      this.timers.delete(t)
      f()
    }, ms)
    this.timers.add(t)
  }
  private escuchar<K extends keyof DocumentEventMap>(blanco: Document, ev: K, f: (e: DocumentEventMap[K]) => void) {
    blanco.addEventListener(ev, f)
    this.limpiezas.push(() => blanco.removeEventListener(ev, f))
  }
  private ahora() {
    return Date.now() + (this.op.desfase || 0)
  }

  private petalos() {
    if (this.reduce) return
    for (let i = 0; i < 14; i++) {
      const p = el('i', 'petalo')
      p.style.left = Math.random() * 100 + '%'
      p.style.animationDuration = 8 + Math.random() * 8 + 's'
      p.style.animationDelay = -Math.random() * 14 + 's'
      p.style.setProperty('--x', Math.random() * 120 - 60 + 'px')
      p.style.setProperty('--r', Math.random() * 540 + 'deg')
      this.root.appendChild(p)
    }
  }

  private corazones(x: number, y: number, n: number) {
    if (this.reduce) return
    const r = this.root.getBoundingClientRect()
    for (let i = 0; i < n; i++) {
      const s = el('span', 'corazon')
      s.innerHTML = CORAZON
      s.style.left = x - r.left - 11 + 'px'
      s.style.top = y - r.top - 11 + 'px'
      s.style.setProperty('--dx', Math.random() * 220 - 110 + 'px')
      s.style.setProperty('--dy', -80 - Math.random() * 220 + 'px')
      s.style.setProperty('--r', Math.random() * 80 - 40 + 'deg')
      this.root.appendChild(s)
      this.despues(1500, () => s.remove())
    }
  }

  private centro(e: Element) {
    const r = e.getBoundingClientRect()
    return [r.left + r.width / 2, r.top + r.height / 2]
  }

  private ir(id: string) {
    this.root.querySelectorAll('.pantalla').forEach((s) => s.classList.toggle('on', s.id === id))
    this.cerrarPaneles()
  }

  private ponerEstilo(v: Estilo) {
    this.root.classList.toggle('estilo-papel', v !== 'bordo')
    this.root
      .querySelectorAll<HTMLElement>('#estilo-switch button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.estilo === (v === 'bordo' ? 'bordo' : 'papel'))))
  }

  // ---------- cajita de música ----------
  private prepararAudio() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const master = ctx.createGain()
    master.gain.value = 0.9
    const eco = ctx.createDelay(),
      vuelta = ctx.createGain(),
      filtro = ctx.createBiquadFilter()
    eco.delayTime.value = 0.27
    vuelta.gain.value = 0.28
    filtro.type = 'lowpass'
    filtro.frequency.value = 2400
    master.connect(ctx.destination)
    master.connect(eco)
    eco.connect(filtro)
    filtro.connect(vuelta)
    vuelta.connect(eco)
    filtro.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
  }
  private nota(t: number, f: number) {
    const ctx = this.ctx!
    ;(
      [
        [f, 'sine', 0.1],
        [f * 2, 'triangle', 0.022],
      ] as [number, OscillatorType, number][]
    ).forEach((v) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain()
      o.type = v[1]
      o.frequency.value = v[0]
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(v[2], t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
      o.connect(g)
      g.connect(this.master!)
      o.start(t)
      o.stop(t + 1.7)
    })
  }
  private melodia = () => {
    if (this.muda || !this.ctx) return
    const t = this.ctx.currentTime + 0.05
    NOTAS.forEach((f, i) => this.nota(t + i * 0.3, f))
    this.bucle = window.setTimeout(this.melodia, NOTAS.length * 300)
  }
  private musica() {
    try {
      if (!this.ctx) this.prepararAudio()
      this.ctx!.resume()
      this.root.classList.add('sonido')
      clearTimeout(this.bucle)
      this.melodia()
    } catch {
      /* sin sonido */
    }
  }
  private pararMusica() {
    clearTimeout(this.bucle)
    this.root.classList.remove('sonido')
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend()
  }
  private volumen(v: number) {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2)
  }

  // ---------- audios dentro de la carta ----------
  private burbuja(a: AudioCarta) {
    const bt = el('button', 'audio')
    bt.type = 'button'
    bt.setAttribute('aria-label', 'Escuchar el mensaje de ' + (a.quien || 'la familia'))
    const pl = el('span', 'play')
    pl.innerHTML = PLAY
    const info = el('span', 'info'),
      onda = el('span', 'onda')
    for (let k = 0; k < 34; k++) {
      const b = el('i', '')
      b.style.height = 5 + Math.round(Math.abs(Math.sin(k * 1.7 + (a.quien || '').length) * Math.cos(k * 0.45)) * 17) + 'px'
      b.style.setProperty('--k', (k / 34).toFixed(3))
      onda.append(b)
    }
    info.append(el('span', 'quien', a.quien || 'Un mensaje'), onda)
    const dur = el('span', 'dur', mmss(a.seg))
    bt.append(pl, info, dur)
    bt.addEventListener('click', () => this.tocarAudio(bt, a, dur))
    return bt
  }
  private tocarAudio(bt: HTMLElement, a: AudioCarta, dur: HTMLElement) {
    const era = bt === this.sonando
    this.pararAudio()
    if (era) return
    this.sonando = bt
    bt.classList.add('sonando')
    bt.querySelector('.play')!.innerHTML = PAUSA
    this.volumen(0.15)
    const arrancar = (seg: number) => bt.style.setProperty('--dur', (seg || 15) + 's')
    if (a.src) {
      const rep = new Audio(a.src)
      this.reproductor = rep
      rep.onloadedmetadata = () => {
        if (isFinite(rep.duration)) {
          arrancar(rep.duration)
          dur.textContent = mmss(rep.duration)
        }
      }
      rep.onended = () => this.pararAudio()
      rep.play().catch(() => this.pararAudio())
      arrancar(a.seg)
    } else {
      // Ejemplo: no hay audio real, se anima la onda
      arrancar(a.seg)
      this.finAudio = window.setTimeout(() => this.pararAudio(), (a.seg || 10) * 1000)
    }
  }
  private pararAudio() {
    clearTimeout(this.finAudio)
    if (this.reproductor) {
      this.reproductor.pause()
      this.reproductor = null
    }
    if (!this.sonando) return
    this.sonando.classList.remove('sonando')
    this.sonando.querySelector('.play')!.innerHTML = PLAY
    this.sonando = null
    this.volumen(0.9)
  }

  // ---------- armar las pantallas ----------
  private armar(d: CartaVista) {
    this.carta = d
    const voz = (this.voz = this.ocasion.voces(esPlural(d.de)))
    this.ponerEstilo(d.estilo)
    const f = d.fotos,
      muestras = !!f.muestras
    conCursiva(this.$('s-titulo'), d.para + ', esto es *para vos*')
    this.$('s-de').textContent = 'De ' + d.de + ', con amor'
    this.$('s-hoja').textContent = this.ocasion.textos.hoja(d.para)
    this.$('s-remite').textContent = d.de.length <= 22 ? 'de ' + d.de : ''
    this.$('r-titulo').textContent = d.regaloTitulo || 'Un abrazo enorme'
    this.$('r-detalle').textContent = d.regaloDetalle || ''
    conCursiva(this.$('fin-titulo'), voz.quiero + ', *' + d.para + '.*')
    this.$('fin-firma').textContent = d.de
    this.$('abrazo-txt').textContent = voz.abrazo
    this.$('contestar').textContent = voz.contestar
    this.$('pc-titulo').textContent = voz.contestar + ' a ' + d.de
    this.$('sobre').classList.remove('abierto')
    this.$('abrazos').textContent = ''
    this.abrazos = 0
    this.$<HTMLTextAreaElement>('pc-texto').value = ''
    this.$('pc-ok').textContent = ''

    const cont = this.$('slides')
    cont.textContent = ''
    const nueva = (dur: number, clase?: string) => {
      const s = el('article', 'slide' + (clase ? ' ' + clase : '')) as Slide
      s.dataset.d = String(dur)
      cont.appendChild(s)
      return s
    }
    const adelante = () => this.adelante()
    let s: Slide, t: HTMLElement

    // Apertura
    s = nueva(5200)
    t = el('div', 'texto')
    t.append(palabras('h2', 'titulo', d.titulo ? marcar(d.titulo) : voz.titulo(d.para), 0))
    if (d.subtitulo) t.append(palabras('p', 'suave', d.subtitulo, 0.9))
    s.append(t)

    // Canción
    if (d.cancion || d.cancionNombre) {
      s = nueva(0, 'interactiva')
      const disco = el('div', 'disco'),
        vin = el('div', 'vinilo'),
        et = el('div', 'etiqueta')
      et.append(el('span', '', 'Para ' + d.para))
      vin.append(et)
      disco.append(vin, el('div', 'brillo'))
      t = el('div', 'texto')
      t.append(el('p', 'eyebrow', 'Antes de seguir'), palabras('h2', 'titulo lg', voz.elegi, 0))
      if (d.cancionNombre) t.append(el('p', 'tema', '“' + d.cancionNombre + '”'))
      const rep = el('div', 'reproductor'),
        fila = el('div', 'fila'),
        play = el('button', 'btn rosa', 'Dale play'),
        sg = el('button', 'btn vidrio', 'Seguir')
      play.type = sg.type = 'button'
      play.insertAdjacentHTML('afterbegin', PLAY)
      play.addEventListener('click', () => {
        disco.classList.add('gira')
        play.hidden = true
        if (EMBEBER && d.cancion) {
          const fr = document.createElement('iframe')
          fr.src = embedCancion(d.cancion)
          fr.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
          fr.title = 'Reproductor de la canción'
          fr.loading = 'lazy'
          if (d.cancion.tipo === 'youtube') fr.style.aspectRatio = '16 / 9'
          else fr.height = '80'
          rep.textContent = ''
          rep.append(fr)
        } else this.musica()
      })
      sg.addEventListener('click', adelante)
      fila.append(play, sg)
      t.append(rep, fila)
      s.append(disco, t)
    }

    // Carta escrita
    if (d.carta) {
      s = nueva(0)
      const pa = el('div', 'papel')
      d.carta
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((l) => pa.append(el('p', '', l)))
      pa.append(el('p', 'firma', d.de))
      const sg = el('p', 'seguir', 'Tocá para seguir')
      sg.insertAdjacentHTML(
        'beforeend',
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
      )
      s.append(pa, sg)
    }

    // Recuerdo: vertical a pantalla completa; horizontal entera con fondo desenfocado
    if (f.principal || d.recuerdo || muestras) {
      s = nueva(6000)
      const fo = el('div', 'foto'),
        fd = el('div', '')
      fd.style.backgroundImage = imagen(f.principal, 'mar')
      fo.append(fd)
      const en = el('div', 'entera')
      if (f.principal) {
        const img = new Image()
        img.alt = d.recuerdo || 'Un recuerdo'
        const sl = s
        if (f.principal.ancho && f.principal.alto && f.principal.ancho > f.principal.alto * 1.05)
          sl.classList.add('horizontal')
        img.onload = () => {
          if (img.naturalWidth > img.naturalHeight * 1.05) sl.classList.add('horizontal')
        }
        img.src = f.principal.url
        en.append(img)
      }
      t = el('div', 'texto')
      if (d.lugar) t.append(el('p', 'lugar aparece', d.lugar))
      t.append(palabras('h2', 'titulo lg', marcar(d.recuerdo || 'Todo lo lindo empezó con vos.'), 0.3))
      s.append(fo, en, t)
    }

    // Contador
    if (d.desde && !isNaN(Date.parse(d.desde)) && this.ocasion.contador) {
      s = nueva(5500)
      s.dataset.contar = d.desde
      t = el('div', 'texto centro')
      const pie = el('p', 'suave aparece', this.ocasion.contador.pie)
      pie.style.animationDelay = '1.4s'
      t.append(el('p', 'eyebrow', 'Hace'), el('p', 'grande', '0'), palabras('h2', 'titulo lg', voz.contador, 0.4), pie)
      s.append(t)
    }

    // Antes y ahora
    if ((f.antes && f.ahora) || muestras) {
      s = nueva(0, 'interactiva')
      const comp = el('div', 'media comparar'),
        marco = el('div', 'marco')
      const ca = el('div', 'capa ahora'),
        cb = el('div', 'capa antes'),
        man = el('div', 'manija')
      ca.style.backgroundImage = imagen(f.ahora, 'flores')
      cb.style.backgroundImage = imagen(f.antes, 'sierras')
      marco.append(ca, cb, man, el('span', 'etq izq', d.antesTxt || 'Antes'), el('span', 'etq der', d.ahoraTxt || 'Ahora'))
      marco.setAttribute('role', 'slider')
      marco.setAttribute('aria-label', 'Deslizá para comparar antes y ahora')
      marco.tabIndex = 0
      comp.append(marco)
      t = el('div', 'texto')
      const pie = el('p', 'suave aparece', 'Hay cosas que no cambian.')
      pie.style.animationDelay = '.9s'
      t.append(el('p', 'eyebrow', 'Deslizá con el dedo'), palabras('h2', 'titulo lg', 'Antes y *ahora.*', 0), pie)
      const sg = el('button', 'btn vidrio', 'Seguir')
      sg.type = 'button'
      sg.addEventListener('click', adelante)
      t.append(sg)
      s.append(comp, t)
      s.dataset.comparar = '1'
      this.prepararComparar(marco)
    }

    // Polaroids
    if ((['p0', 'p1', 'p2'] as const).some((k) => f[k]) || muestras) {
      s = nueva(6000)
      const polas = el('div', 'media polas')
      ;(['p0', 'p1', 'p2'] as const).forEach((k, i) => {
        const po = el('div', 'pola'),
          im = el('div', '')
        im.style.backgroundImage = imagen(f[k], (['sierras', 'luces', 'flores'] as Muestra[])[i])
        po.append(im, el('p', '', d.polas[i] || ''))
        polas.append(po)
      })
      t = el('div', 'texto')
      const vos = el('p', 'lugar aparece', 'Vos.')
      vos.style.animationDelay = '1.1s'
      t.append(palabras('h2', 'titulo lg', voz.fotos, 0), vos)
      s.append(polas, t)
    }

    // Pila de fotos
    const gal = (f.pila || []).slice(0, 6)
    if (gal.length) {
      s = nueva(0)
      s.dataset.pila = '1'
      const pila = el('div', 'media pila')
      gal.forEach((g, i) => {
        const pf = el('div', 'pf'),
          img = new Image()
        img.alt = 'Foto ' + (i + 1)
        img.src = fuente(g, MUESTRA_GAL[i], FORMA_GAL[i][0], FORMA_GAL[i][1])
        pf.style.setProperty('--rot', [-6, 5, -3, 7, -8, 3][i] + 'deg')
        pf.style.zIndex = String(i + 1)
        pf.append(img)
        pila.append(pf)
      })
      pila.append(el('span', 'pila-cuenta', ''))
      t = el('div', 'texto')
      t.append(palabras('h2', 'titulo lg', 'Y estas *también.*', 0.3), el('p', 'nota', 'Tocá la foto para ver la siguiente.'))
      s.append(pila, t)
    }

    // Audios del autor
    const auds = (d.audios || []).slice(0, 6)
    if (auds.length) {
      s = nueva(0, 'interactiva')
      t = el('div', 'texto')
      t.append(el('p', 'eyebrow', voz.unico), palabras('h2', 'titulo lg', 'Te dejaron *mensajes.*', 0))
      const lista = el('div', 'audios')
      auds.forEach((a) => lista.append(this.burbuja(a)))
      const sg = el('button', 'btn vidrio', 'Seguir')
      sg.type = 'button'
      sg.addEventListener('click', adelante)
      t.append(lista, sg)
      s.append(t)
    }

    // Mensajes de la familia, uno por pantalla
    const colores = ['#fff3c9', '#ffe1ea', '#e4efff', '#e6f4dd']
    ;(d.mensajes || []).slice(0, 30).forEach((m, i, todos) => {
      s = nueva(0)
      const conFoto = !!(m.foto || m.muestra)
      if (conFoto) {
        const ff = el('div', 'foto-fam'),
          pf = el('div', 'pf'),
          img = new Image()
        img.alt = 'Foto de ' + m.nombre
        img.src = fuente(m.foto, m.muestra, 520, 400)
        pf.append(img)
        ff.append(pf)
        s.append(ff)
      }
      const head = el('div', 'texto')
      head.style.marginTop = '0'
      head.append(
        el('p', 'eyebrow', i === 0 ? 'También te escribieron · ' + (i + 1) + ' de ' + todos.length : i + 1 + ' de ' + todos.length),
      )
      const nota = el('div', 'nota-fam')
      nota.style.setProperty('--color', colores[i % 4])
      nota.append(String(m.texto || ''))
      nota.append(el('span', 'quien', m.nombre || 'Alguien que te quiere'))
      if (!conFoto) s.append(head, nota)
      else {
        s.insertBefore(head, s.firstChild)
        s.append(nota)
        nota.style.marginBlock = '0'
      }
      if (m.audio) {
        const l = el('div', 'audios')
        l.append(this.burbuja(m.audio))
        s.append(l)
      }
    })

    // Gracias
    if (d.gracias.length) {
      s = nueva(Math.max(4200, d.gracias.length * 1500))
      s.dataset.frases = '1'
      t = el('div', 'texto centro')
      t.append(el('p', 'eyebrow', 'Gracias por…'), el('p', 'frase', d.gracias[0]))
      s.append(t)
    }

    // Cierre
    s = nueva(0, 'interactiva')
    t = el('div', 'texto')
    t.append(palabras('h2', 'titulo', 'Y como no alcanzan *las palabras…*', 0), palabras('p', 'suave', voz.dejo, 0.9))
    const b = el('button', 'btn rosa', 'Abrí tu regalo')
    b.type = 'button'
    b.insertAdjacentHTML(
      'afterbegin',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
    )
    b.addEventListener('click', () => this.irRegalo())
    t.append(b)
    s.append(t)

    this.slides = [...cont.children] as Slide[]
    const barras = this.$('barras')
    barras.textContent = ''
    this.slides.forEach(() => {
      const i = el('i', '')
      i.append(el('b', ''))
      barras.append(i)
    })
  }

  // Antes y ahora: arrastrar la manija
  private prepararComparar(marco: HTMLElement) {
    const poner = (cx: number) => {
      const r = marco.getBoundingClientRect()
      const p = Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100))
      marco.style.setProperty('--x', p.toFixed(1) + '%')
      marco.setAttribute('aria-valuenow', String(Math.round(p)))
    }
    let arrastrando = false
    marco.addEventListener('pointerdown', (e) => {
      arrastrando = true
      marco.dataset.tocado = '1'
      marco.setPointerCapture(e.pointerId)
      poner(e.clientX)
    })
    marco.addEventListener('pointermove', (e) => {
      if (arrastrando) poner(e.clientX)
    })
    ;['pointerup', 'pointercancel'].forEach((ev) =>
      marco.addEventListener(ev, () => {
        arrastrando = false
      }),
    )
    marco.addEventListener('keydown', (e) => {
      const v = parseFloat(marco.style.getPropertyValue('--x')) || 50
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation()
        e.preventDefault()
        marco.dataset.tocado = '1'
        marco.style.setProperty('--x', Math.max(0, Math.min(100, v + (e.key === 'ArrowLeft' ? -5 : 5))) + '%')
      }
    })
  }
  private mostrarComparar(s: HTMLElement) {
    const marco = s.querySelector<HTMLElement>('.marco')
    if (!marco || this.reduce) return
    marco.dataset.tocado = ''
    const t0 = performance.now()
    const paso = (t: number) => {
      if (marco.dataset.tocado || !s.classList.contains('on')) return
      const k = Math.min(1, (t - t0) / 2600)
      marco.style.setProperty('--x', (50 + Math.sin(k * Math.PI * 2) * 32 * (1 - k * 0.4)).toFixed(1) + '%')
      if (k < 1) requestAnimationFrame(paso)
      else marco.style.setProperty('--x', '50%')
    }
    paso(t0)
  }

  // Pila: cae una foto por vez
  private mostrarPila(s: Slide) {
    const fs = [...s.querySelectorAll('.pf')],
      cuenta = s.querySelector('.pila-cuenta')!
    fs.forEach((p) => p.classList.remove('cae'))
    let i = 0
    const tirar = () => {
      if (i >= fs.length) return false
      fs[i].classList.add('cae')
      i++
      cuenta.textContent = i + ' de ' + fs.length
      return true
    }
    s._pila = () => {
      clearInterval(this.pilaTimer)
      const ok = tirar()
      if (ok)
        this.pilaTimer = window.setInterval(() => {
          if (!tirar()) clearInterval(this.pilaTimer)
        }, 2200)
      return ok
    }
    tirar()
    this.pilaTimer = window.setInterval(() => {
      if (!tirar()) clearInterval(this.pilaTimer)
    }, 1800)
  }

  // ---------- historia ----------
  private barraActual() {
    const i = this.$('barras').children[this.actual]
    return i && (i.firstChild as HTMLElement)
  }
  private programar(ms: number) {
    if (this.temporizador) clearTimeout(this.temporizador)
    this.restante = ms
    this.inicioT = Date.now()
    this.temporizador = window.setTimeout(() => {
      this.temporizador = null
      this.adelante()
    }, ms)
  }
  private pausar() {
    if (!this.temporizador) return
    clearTimeout(this.temporizador)
    this.temporizador = null
    this.restante = Math.max(0, this.restante - (Date.now() - this.inicioT))
    const b = this.barraActual()
    if (b) b.style.animationPlayState = 'paused'
  }
  private reanudar() {
    const s = this.slides[this.actual]
    if (this.temporizador || this.restante <= 0 || !s || !+s.dataset.d!) return
    const b = this.barraActual()
    if (b) b.style.animationPlayState = 'running'
    this.programar(this.restante)
  }
  private mostrar(n: number) {
    this.actual = n
    this.pararAudio()
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = null
    this.restante = 0
    clearInterval(this.frasesTimer)
    clearInterval(this.pilaTimer)
    cancelAnimationFrame(this.contadorAnim)
    this.slides.forEach((s, k) => {
      s.classList.toggle('on', k === n)
      if (k === n) s.scrollTop = 0
    })
    const s = this.slides[n],
      d = +s.dataset.d!
    ;[...this.$('barras').children].forEach((b, k) => {
      const barra = b.firstChild as HTMLElement
      barra.style.animationPlayState = ''
      b.className = k < n ? 'lista' : ''
      if (k === n) {
        void (b as HTMLElement).offsetWidth
        b.className = d ? 'ahora' : 'lista'
        ;(b as HTMLElement).style.setProperty('--d', d + 'ms')
      }
    })
    if (s.dataset.contar) this.contar(s.dataset.contar, s.querySelector('.grande')!)
    if (s.dataset.comparar) this.mostrarComparar(s)
    if (s.dataset.pila) this.mostrarPila(s)
    if (s.dataset.frases && this.carta) {
      const gracias = this.carta.gracias
      let i = 0
      const fr = s.querySelector('.frase')!
      fr.textContent = gracias[0]
      this.frasesTimer = window.setInterval(() => {
        i = (i + 1) % gracias.length
        fr.textContent = gracias[i]
        fr.classList.remove('cambia')
        void (fr as HTMLElement).offsetWidth
        fr.classList.add('cambia')
      }, 1500)
    }
    if (d) this.programar(d)
  }
  private adelante() {
    if (this.actual < this.slides.length - 1) this.mostrar(this.actual + 1)
  }
  private atras() {
    if (this.actual > 0) this.mostrar(this.actual - 1)
  }
  private contar(desde: string, nodo: Element) {
    const dias = Math.max(0, Math.floor((this.ahora() - Date.parse(desde + 'T12:00:00-03:00')) / 864e5))
    if (this.reduce) {
      nodo.textContent = dias.toLocaleString('es-AR')
      return
    }
    const t0 = performance.now()
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 1700)
      nodo.textContent = Math.round(dias * (1 - Math.pow(1 - k, 3))).toLocaleString('es-AR')
      if (k < 1) this.contadorAnim = requestAnimationFrame(paso)
    }
    paso(t0)
  }

  // ---------- raspadita ----------
  private prepararRaspadita() {
    const canvas = this.$<HTMLCanvasElement>('raspa')
    const c2d = (this.c2d = canvas.getContext('2d', { willReadFrequently: true })!)
    const r = canvas.getBoundingClientRect(),
      dpr = window.devicePixelRatio || 1
    canvas.width = r.width * dpr
    canvas.height = r.height * dpr
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    c2d.globalCompositeOperation = 'source-over'
    const g = c2d.createLinearGradient(0, 0, r.width, r.height)
    g.addColorStop(0, '#cfc6d3')
    g.addColorStop(0.45, '#f4eff6')
    g.addColorStop(0.55, '#e4dde8')
    g.addColorStop(1, '#b3a8b9')
    c2d.fillStyle = g
    c2d.fillRect(0, 0, r.width, r.height)
    const R = azar(5)
    for (let i = 0; i < 900; i++) {
      c2d.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.5)' : 'rgba(90,70,100,.12)'
      c2d.fillRect(R() * r.width, R() * r.height, 1.4, 1.4)
    }
    c2d.fillStyle = 'rgba(120,100,130,.16)'
    c2d.font = '20px serif'
    c2d.textAlign = 'center'
    for (let y = 22; y < r.height; y += 34) for (let x = ((y / 34) % 2) * 26 + 16; x < r.width; x += 52) c2d.fillText('♥', x, y)
    c2d.fillStyle = '#6f6278'
    c2d.font = "700 14px 'DM Sans', system-ui, sans-serif"
    c2d.fillText('R A S P Á   A C Á', r.width / 2, r.height / 2 + 5)
    canvas.style.opacity = '1'
    this.descubierta = false
    this.toques = 0
  }
  private raspar(e: PointerEvent) {
    if (!this.raspando || this.descubierta || !this.c2d) return
    const canvas = this.$<HTMLCanvasElement>('raspa')
    const r = canvas.getBoundingClientRect()
    this.c2d.globalCompositeOperation = 'destination-out'
    this.c2d.beginPath()
    this.c2d.arc(e.clientX - r.left, e.clientY - r.top, 22, 0, Math.PI * 2)
    this.c2d.fill()
    if (++this.toques % 8 === 0 && this.porcentaje() > 0.45) this.descubrir()
  }
  private porcentaje() {
    const canvas = this.$<HTMLCanvasElement>('raspa')
    const d = this.c2d!.getImageData(0, 0, canvas.width, canvas.height).data
    let v = 0,
      n = 0
    for (let i = 3; i < d.length; i += 64) {
      n++
      if (d[i] === 0) v++
    }
    return v / n
  }
  private descubrir() {
    if (this.descubierta) return
    this.descubierta = true
    const canvas = this.$<HTMLCanvasElement>('raspa')
    canvas.style.opacity = '0'
    const c = this.centro(canvas)
    this.corazones(c[0], c[1], 24)
    this.despues(this.reduce ? 200 : 2000, () => this.ir('p-final'))
  }
  private irRegalo() {
    this.pausar()
    this.pararAudio()
    this.ir('p-regalo')
    requestAnimationFrame(() => this.prepararRaspadita())
  }

  // ---------- final ----------
  private mandarAbrazos() {
    clearTimeout(this.abrazoT)
    const nuevos = this.abrazos - this.abrazosMandados
    if (nuevos > 0) {
      this.abrazosMandados = this.abrazos
      this.op.onEvento?.({ tipo: 'abrazos', cantidad: Math.min(nuevos, 100) })
    }
  }
  private abrirPanel(id: string) {
    this.$('velo').classList.add('on')
    this.$(id).classList.add('on')
    const f = this.$(id).querySelector<HTMLElement>('textarea, .btn.rosa')
    if (f) this.despues(350, () => f.focus())
  }
  private cerrarPaneles() {
    this.$('velo')?.classList.remove('on')
    this.root.querySelectorAll('.panel').forEach((p) => p.classList.remove('on'))
  }

  private async hacerImagen(): Promise<Blob | null> {
    const carta = this.carta!
    const voz = this.voz
    const W = 1080,
      H = 1920,
      c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    try {
      await Promise.all(
        ['110px "Instrument Serif"', 'italic 110px "Instrument Serif"', '700 80px Caveat', '600 30px "DM Sans"'].map((f) =>
          document.fonts.load(f),
        ),
      )
    } catch {
      /* fuentes de reserva */
    }
    const pap = carta.estilo !== 'bordo',
      C = pap
        ? { a: '#fbf5ea', b: '#efe5d4', c: '#e6d9c3', luz: 'rgba(255,255,255,.6)', eb: '#2346a0', t: '#2a211b', em: '#c43c55', f: '#cf3f45', pie: 'rgba(42,33,27,.5)' }
        : { a: '#4a1a36', b: '#22101b', c: '#120810', luz: 'rgba(238,107,147,.35)', eb: '#e9b764', t: '#fbf3ea', em: '#f7c9d6', f: '#ee6b93', pie: 'rgba(251,243,234,.55)' }
    const fondo = g.createLinearGradient(0, 0, 0, H)
    fondo.addColorStop(0, C.a)
    fondo.addColorStop(0.55, C.b)
    fondo.addColorStop(1, C.c)
    g.fillStyle = fondo
    g.fillRect(0, 0, W, H)
    const luz = g.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900)
    luz.addColorStop(0, C.luz)
    luz.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = luz
    g.fillRect(0, 0, W, H)
    g.textAlign = 'center'
    g.fillStyle = C.eb
    g.font = '600 30px "DM Sans", sans-serif'
    g.fillText(this.ocasion.textos.eyebrow.toUpperCase().split('').join(' '), W / 2, 230)
    const f = carta.fotos
    const foto = [f.principal, f.p0, f.p1, f.p2, f.ahora, ...(f.pila || [])].find((x) => x)
    const img = await cargarImg(fuente(foto, 'mar', 800, 800))
    g.save()
    g.translate(W / 2, 760)
    g.rotate((-3 * Math.PI) / 180)
    g.shadowColor = 'rgba(0,0,0,.55)'
    g.shadowBlur = 60
    g.shadowOffsetY = 30
    g.fillStyle = '#fffdf8'
    g.fillRect(-330, -390, 660, 780)
    g.shadowColor = 'transparent'
    if (img) {
      const s = Math.max(600 / img.width, 600 / img.height),
        w = img.width * s,
        h = img.height * s
      g.save()
      g.beginPath()
      g.rect(-300, -360, 600, 600)
      g.clip()
      g.drawImage(img, -w / 2, -60 - h / 2, w, h)
      g.restore()
    }
    g.fillStyle = '#2b1622'
    g.font = '700 64px Caveat, cursive'
    g.fillText('Para ' + carta.para, 0, 330)
    g.restore()
    const a = voz.quiero + ', ',
      b = carta.para + '.'
    g.font = '110px "Instrument Serif", Georgia, serif'
    const wa = g.measureText(a).width
    g.font = 'italic 110px "Instrument Serif", Georgia, serif'
    const wb = g.measureText(b).width
    const x = (W - wa - wb) / 2
    g.textAlign = 'left'
    g.font = '110px "Instrument Serif", Georgia, serif'
    g.fillStyle = C.t
    g.fillText(a, x, 1420)
    g.font = 'italic 110px "Instrument Serif", Georgia, serif'
    g.fillStyle = C.em
    g.fillText(b, x + wa, 1420)
    g.textAlign = 'center'
    g.fillStyle = C.f
    g.font = '700 84px Caveat, cursive'
    g.fillText(carta.de.length > 26 ? carta.de.slice(0, 25) + '…' : carta.de, W / 2, 1560)
    g.fillStyle = C.pie
    g.font = '500 30px "DM Sans", sans-serif'
    g.fillText('Hecha con Cartita', W / 2, 1810)
    return new Promise((ok) => {
      try {
        c.toBlob((bl) => ok(bl), 'image/png')
      } catch {
        ok(null)
      }
    })
  }

  private async guardarImagen() {
    const blob = this.imagenBlob
    if (!blob) return
    const nombre = this.ocasion.textos.archivoImagen
    const archivo = new File([blob], nombre, { type: 'image/png' })
    const ok = this.$('pe-ok')
    try {
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo] })
        ok.textContent = '¡Listo!'
        return
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
    try {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = nombre
      document.body.append(a)
      a.click()
      a.remove()
      this.despues(4000, () => URL.revokeObjectURL(a.href))
      ok.textContent = '¡Guardada! Ya la podés subir a tu estado.'
    } catch {
      ok.textContent = 'Mantené apretada la imagen y elegí “Guardar”.'
    }
  }

  // ---------- espera ----------
  private abreDesde() {
    return this.carta ? this.carta.abreDesde : this.espera?.abreDesde || null
  }
  private esperaHasta() {
    const a = this.abreDesde()
    return a && Date.parse(a) > this.ahora() ? Date.parse(a) : 0
  }
  private mostrarEspera(saltable: boolean) {
    const fin = this.esperaHasta()
    const de = (this.carta || this.espera)!.de
    this.$('espera-txt').textContent =
      de + ' ' + (esPlural(de) ? 'te dejaron' : 'te dejó') + ' esta carta para el ' + fechaLinda(this.abreDesde()!) + '.'
    this.$('saltar-espera').hidden = !saltable
    this.$('ya-abrir').hidden = true
    const caja = this.$('cuenta')
    caja.textContent = ''
    const u = ['días', 'horas', 'min', 'seg'].map((n) => {
      const d = el('div', 'u'),
        b = el('b', '', '0')
      d.append(b, el('small', '', n))
      caja.append(d)
      return b
    })
    clearInterval(this.esperaTimer)
    const tic = () => {
      const r = Math.max(0, fin - this.ahora()),
        s = Math.floor(r / 1000)
      ;[Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].forEach((v, i) => {
        u[i].textContent = String(v).padStart(2, '0')
      })
      if (!r) {
        clearInterval(this.esperaTimer)
        this.$('ya-abrir').hidden = false
      }
    }
    tic()
    this.esperaTimer = window.setInterval(tic, 1000)
    this.ir('p-espera')
  }

  // ---------- eventos fijos ----------
  private conectar() {
    const $ = (id: string) => this.$(id)
    $('cerrar').addEventListener('click', () => this.op.onCerrar?.())
    $('mute').addEventListener('click', () => {
      this.muda = !this.muda
      clearTimeout(this.bucle)
      this.root.querySelector<SVGElement>('#ondas')!.style.display = this.muda ? 'none' : ''
      $('mute').setAttribute('aria-pressed', String(this.muda))
      $('mute').setAttribute('aria-label', this.muda ? 'Activar la música' : 'Silenciar la música')
      if (!this.muda) this.melodia()
    })
    this.escuchar(document, 'visibilitychange', () => {
      if (this.ctx && this.root.classList.contains('sonido')) {
        if (document.hidden) this.ctx.suspend()
        else this.ctx.resume()
      }
    })

    const hist = $('p-historia')
    const interactivo = (e: Event) => (e.target as Element).closest('button, a, iframe, .marco')
    hist.addEventListener('pointerdown', (e) => {
      if (interactivo(e)) return
      this.presion = Date.now()
      this.pausar()
    })
    const soltar = () => {
      if (!this.presion) return
      this.retenido = Date.now() - this.presion > 300
      this.presion = 0
      this.reanudar()
    }
    ;['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => hist.addEventListener(ev, soltar))
    hist.addEventListener('click', (e) => {
      if (interactivo(e)) return
      if (this.retenido) {
        this.retenido = false
        return
      }
      const r = this.root.getBoundingClientRect(),
        izq = e.clientX - r.left < r.width * 0.3,
        s = this.slides[this.actual]
      if (!izq && s && s._pila && (e.target as Element).closest('.pila') && s._pila()) return
      if (izq) this.atras()
      else this.adelante()
    })
    $('anterior').addEventListener('click', () => this.atras())
    $('siguiente').addEventListener('click', () => this.adelante())
    this.escuchar(document, 'keydown', (e) => {
      if (e.key === 'Escape') this.cerrarPaneles()
      if (!hist.classList.contains('on')) return
      if (e.key === 'ArrowRight') this.adelante()
      if (e.key === 'ArrowLeft') this.atras()
    })
    $('sobre').addEventListener('click', () => {
      const s = $('sobre')
      if (s.classList.contains('abierto') || !this.carta) return
      s.classList.add('abierto')
      if (!this.carta.cancion && !this.carta.cancionNombre) this.musica()
      if (this.op.modo === 'link') this.op.onEvento?.({ tipo: 'abierta' })
      const c = this.centro(s)
      this.corazones(c[0], c[1], 16)
      this.despues(this.reduce ? 200 : 1800, () => {
        this.ir('p-historia')
        this.mostrar(0)
      })
    })

    const canvas = this.root.querySelector<HTMLCanvasElement>('#raspa')!
    canvas.addEventListener('pointerdown', (e) => {
      this.raspando = true
      canvas.setPointerCapture(e.pointerId)
      this.raspar(e)
    })
    canvas.addEventListener('pointermove', (e) => this.raspar(e))
    canvas.addEventListener('pointerup', () => {
      this.raspando = false
    })
    $('saltear').addEventListener('click', () => this.descubrir())

    $('abrazo').addEventListener('click', (e) => {
      this.abrazos++
      $('abrazos').textContent = this.voz.llego(this.abrazos)
      const c = this.centro(e.currentTarget as Element)
      this.corazones(c[0], c[1], 20)
      clearTimeout(this.abrazoT)
      if (this.op.modo === 'link') this.abrazoT = window.setTimeout(() => this.mandarAbrazos(), 900)
    })
    $('otra-vez').addEventListener('click', () => {
      $('sobre').classList.remove('abierto')
      $('abrazos').textContent = ''
      this.pararMusica()
      if (this.esperaHasta()) this.mostrarEspera(this.op.modo !== 'link')
      else this.ir('p-sobre')
    })
    $('velo').addEventListener('click', () => this.cerrarPaneles())
    this.root.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => this.cerrarPaneles()))
    $('contestar').addEventListener('click', () => this.abrirPanel('panel-contestar'))
    $('pc-enviar').addEventListener('click', () => {
      const area = this.$<HTMLTextAreaElement>('pc-texto')
      const txt = area.value.trim()
      if (!txt) {
        area.focus()
        return
      }
      const link = this.op.modo === 'link'
      if (link) this.op.onEvento?.({ tipo: 'respuesta', texto: txt.slice(0, 400) })
      $('pc-ok').textContent = link
        ? '¡Listo! ' + this.carta!.de + ' va a ver tu respuesta.'
        : 'En la vista previa no se manda: así lo vería ella.'
      this.despues(1600, () => this.cerrarPaneles())
    })
    $('compartir').addEventListener('click', async () => {
      $('pe-ok').textContent = 'Armando la imagen…'
      this.abrirPanel('panel-compartir')
      this.imagenBlob = await this.hacerImagen()
      if (!this.imagenBlob) {
        $('pe-ok').textContent = 'No pudimos armar la imagen en este celular.'
        return
      }
      this.$<HTMLImageElement>('pe-img').src = URL.createObjectURL(this.imagenBlob)
      $('pe-ok').textContent = ''
    })
    $('pe-guardar').addEventListener('click', () => this.guardarImagen())

    $('saltar-espera').addEventListener('click', () => {
      clearInterval(this.esperaTimer)
      this.ir('p-sobre')
    })
    $('ya-abrir').addEventListener('click', () => {
      if (this.carta) this.ir('p-sobre')
      else this.op.onRecargar?.()
    })
    this.root.querySelectorAll<HTMLElement>('#estilo-switch button').forEach((b) =>
      b.addEventListener('click', () => {
        const v = b.dataset.estilo === 'bordo' ? 'bordo' : 'papel'
        if (this.carta) this.carta.estilo = v
        this.ponerEstilo(v)
        this.op.onEstilo?.(v)
      }),
    )
  }
}
