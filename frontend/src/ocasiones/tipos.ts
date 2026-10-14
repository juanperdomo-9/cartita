// Todo lo que cambia por ocasión. Sumar una ocasión = agregar su configuración y su portada,
// sin tocar el motor de la carta.

export type ClaveOcasion =
  | 'dia_madre'
  | 'dia_padre'
  | 'cumpleanos'
  | 'aniversario'
  | 'san_valentin'
  | 'navidad'
  | 'egresados'
  | 'porque_si'

/** Frases de la carta que dependen de si la firma una persona o varias (`voces()`). */
export interface Voces {
  elegi: string
  fotos: string
  contador: string
  dejo: string
  abrazo: string
  llego: (n: number) => string
  quiero: string
  titulo: (para: string) => string
  contestar: string
  unico: string
}

export interface Tarjeta {
  color: string
  sello: string
  emoji: string
  giro: string
  fecha: string
}

interface OcasionBase {
  clave: ClaveOcasion
  nombre: string
  ruta: string
  tarjeta: Tarjeta
}

export interface OcasionProxima extends OcasionBase {
  activa: false
}

export interface OcasionActiva extends OcasionBase {
  activa: true
  /** Pill del armado, ej. "Día de la Madre · dom 18/10" */
  etiqueta: string
  /** Opción "abrir el día" del paso Cuándo la abre (null = no hay fecha fija) */
  apertura: { iso: string; titulo: string; detalle: string; resumen: string } | null
  /** Paso "desde cuándo": días que lleva siendo mamá, papá, etc. (null = no va) */
  contador: { label: string; ayuda: string; max: string; pie: string } | null
  sugerencias: {
    para: string[]
    titulo: string[]
    subtitulo: string[]
    regaloTitulo: string[]
    regaloDetalle: string[]
    gracias: string[]
  }
  textos: {
    paraPlaceholder: string
    tituloPlaceholder: string
    cartaPlaceholder: string
    graciasPlaceholder: string
    audiosAyuda: string
    /** Nombre por defecto si no completan "para" en la vista previa */
    paraDefecto: string
    ejemploCarta: (para: string, plural: boolean) => string
    /** Eyebrow del sobre e imagen para el estado */
    eyebrow: string
    hoja: (para: string) => string
    mensajeElla: (para: string, plural: boolean, link: string) => string
    mensajeFamilia: (para: string, link: string) => string
    familiaExplica: (de: string, plural: boolean, para: string) => string
    archivoImagen: string
  }
  voces: (plural: boolean) => Voces
}

export type Ocasion = OcasionActiva | OcasionProxima
