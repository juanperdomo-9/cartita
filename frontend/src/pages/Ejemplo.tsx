import { useState } from 'react'
import { useNavigate } from 'react-router'
import Escena from '../carta/Escena'
import type { CartaVista } from '../carta/tipos'
import type { OcasionActiva } from '../ocasiones'

// La carta de ejemplo del prototipo (EJEMPLO + EXTRA_EJEMPLO), con ilustraciones de muestra.
function ejemplo(ocasion: OcasionActiva): CartaVista {
  return {
    ocasion: ocasion.clave,
    para: 'Ma',
    de: 'Sofi, Juan y Tomi',
    desde: '1994-03-12',
    titulo: 'Ma, hay cosas que no te decimos *seguido.*',
    subtitulo: 'Así que te hicimos esto.',
    carta:
      'Ma:\nGracias por las milanesas de los domingos, por preguntar siempre si llegamos bien y por bancarnos en todas.\nNo te lo decimos seguido, pero todo lo que somos tiene un poco tuyo.\nTe queremos mucho.',
    lugar: 'Mar del Plata, 1998',
    recuerdo: 'La sombrilla se voló. Vos te reíste *igual.*',
    polas: ['Navidad 2012', 'Tu cumple 60', 'Los cuatro'],
    antesTxt: '1998',
    ahoraTxt: 'Hoy',
    gracias: [
      'las milanesas de los domingos',
      'decir abrigate aunque hagan 30 grados',
      'bancarnos en todas',
      'los mates de la tarde',
      'preguntar si llegamos bien',
      'estar siempre',
    ],
    cancion: null,
    cancionNombre: 'El tema que cantábamos en el auto',
    regaloTitulo: 'Un almuerzo con los tres',
    regaloDetalle: 'el domingo cocinamos nosotros',
    estilo: document.documentElement.classList.contains('oscuro') ? 'bordo' : 'papel',
    abreDesde: null,
    fotos: { muestras: true, pila: [null, null, null, null, null, null] },
    audios: [
      { quien: 'Sofi', seg: 14, src: '' },
      { quien: 'Tomi', seg: 9, src: '' },
      { quien: 'La abuela', seg: 21, src: '' },
    ],
    mensajes: [
      {
        nombre: 'Papá',
        texto: 'Gracias por esta familia que armaste. Sin vos no sabríamos ni dónde están las llaves. Te amo.',
      },
      {
        nombre: 'Tía Ceci',
        texto: '¡Feliz día, cuñada! Gracias por aguantarnos en cada asado y por las mejores tortas.',
        muestra: 'luces',
      },
    ],
  }
}

export default function Ejemplo({ ocasion }: { ocasion: OcasionActiva }) {
  const navegar = useNavigate()
  const [datos] = useState(() => ejemplo(ocasion))
  return <Escena datos={datos} modo="ejemplo" onCerrar={() => navegar(ocasion.ruta)} />
}
