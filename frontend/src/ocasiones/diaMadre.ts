import type { OcasionActiva } from './tipos'

// Día de la Madre (Argentina): domingo 18 de octubre de 2026. Textos del prototipo.
export const diaMadre: OcasionActiva = {
  clave: 'dia_madre',
  nombre: 'Día de la Madre',
  ruta: '/dia-de-la-madre',
  activa: true,
  tarjeta: { color: '#f6d3d8', sello: '#d9566f', emoji: '🌷', giro: '-2deg', fecha: 'dom 18 oct' },
  etiqueta: 'Día de la Madre · dom 18/10',
  apertura: {
    iso: '2026-10-18T00:00:00-03:00',
    titulo: 'El domingo 18 de octubre',
    detalle: 'Desde las 00:00. Ideal para mandarla el sábado a la noche.',
    resumen: 'domingo',
  },
  contador: {
    label: '¿Desde cuándo es mamá?',
    ayuda: 'El día que nació su primer hijo. Con esto le mostramos cuántos días lleva siendo mamá.',
    max: '2026-10-18',
    pie: 'Y no te tomaste ni uno libre.',
  },
  sugerencias: {
    para: ['Ma', 'Mami', 'Mamá', 'Vieja'],
    titulo: ['Ma, hay cosas que no te digo seguido.', 'Ma, esto es para vos.', 'No soy de decir estas cosas, así que…'],
    subtitulo: ['Así que te armé esto.', 'Abrilo con sonido.', 'Tomate tu tiempo.'],
    regaloTitulo: ['Un almuerzo con vos', 'Una salida al cine', 'Un día de spa', 'Una escapada juntos'],
    regaloDetalle: ['el domingo cocino yo', 'elegís vos la peli', 'invito yo', 'cuando quieras'],
    gracias: [
      'las milanesas de los domingos',
      'esperarme despierta',
      'decir abrigate aunque hagan 30 grados',
      'bancarme en todas',
      'los mates de la tarde',
      'preguntar si llegué bien',
      'creer en mí',
      'estar siempre',
    ],
  },
  textos: {
    paraPlaceholder: 'Ma, Mami, Mamá…',
    tituloPlaceholder: 'Ma, hay cosas que no te digo seguido.',
    cartaPlaceholder: 'Ma:\nGracias por…',
    graciasPlaceholder: 'las milanesas de los domingos\nesperarme despierta',
    audiosAyuda:
      'Hasta 4 audios. Para que tus hermanos, tu viejo o tu abuela graben el suyo, al final te damos un link para la familia.',
    paraDefecto: 'Ma',
    ejemploCarta: (p, plural) =>
      plural
        ? `${p}:\nGracias por bancarnos en todas, por esperarnos despierta y por creer en nosotros cuando ni nosotros creíamos.\nNo te lo decimos seguido, pero todo lo que somos tiene un poco tuyo.\nTe queremos mucho.`
        : `${p}:\nGracias por bancarme en todas, por esperarme despierta y por creer en mí cuando ni yo creía.\nNo te lo digo seguido, pero todo lo que soy tiene un poco tuyo.\nTe quiero mucho.`,
    eyebrow: 'Día de la Madre',
    hoja: (para) => 'Feliz día, ' + para,
    mensajeElla: (para, plural, link) =>
      para + ', ' + (plural ? 'te hicimos' : 'te hice') + ' algo. Abrilo con sonido 🔊 ' + link,
    mensajeFamilia: (para, link) =>
      'Le estoy armando una carta a ' +
      para +
      ' para el Día de la Madre. Sumá tu mensaje, una foto o un audio acá (ella no lo ve hasta que la abra): ' +
      link,
    familiaExplica: (de, plural, para) =>
      de +
      ' ' +
      (plural ? 'le están armando' : 'le está armando') +
      ' una carta a ' +
      para +
      ' para el Día de la Madre. Dejá tu mensaje y, si querés, una foto o un audio: aparecen solos en la carta.',
    archivoImagen: 'carta-dia-de-la-madre.png',
  },
  voces: (plural) =>
    plural
      ? {
          elegi: 'Te elegimos *una canción.*',
          fotos: 'Todas nuestras fotos lindas tienen algo en *común.*',
          contador: 'días que sos *nuestra mamá.*',
          dejo: 'te dejamos un regalo.',
          abrazo: 'Mandanos un abrazo',
          llego: (n) => (n === 1 ? '¡Nos llegó tu abrazo!' : '¡Nos llegaron ' + n + ' abrazos!'),
          quiero: 'Te queremos',
          titulo: (p) => p + ', hay cosas que no te decimos *seguido.*',
          contestar: 'Contestales',
          unico: 'No somos los únicos',
        }
      : {
          elegi: 'Te elegí *una canción.*',
          fotos: 'Todas mis fotos lindas tienen algo en *común.*',
          contador: 'días que sos *mi mamá.*',
          dejo: 'te dejo un regalo.',
          abrazo: 'Mandame un abrazo',
          llego: (n) => (n === 1 ? '¡Me llegó tu abrazo!' : '¡Me llegaron ' + n + ' abrazos!'),
          quiero: 'Te quiero',
          titulo: (p) => p + ', hay cosas que no te digo *seguido.*',
          contestar: 'Contestale',
          unico: 'No soy el único',
        },
}
