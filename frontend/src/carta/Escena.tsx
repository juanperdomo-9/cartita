import { useEffect, useLayoutEffect, useRef } from 'react'
import { MotorCarta, type OpcionesMotor } from './motor'
import type { CartaEnEspera, CartaVista } from './tipos'

interface Props extends OpcionesMotor {
  datos: CartaVista | CartaEnEspera
}

/** La carta a pantalla completa. Monta el motor y lo desarma al salir. */
export default function Escena({ datos, ...op }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Los callbacks pueden cambiar en cada render; el motor siempre llama a los últimos.
  const ultimos = useRef(op)
  useLayoutEffect(() => {
    ultimos.current = op
  })

  useEffect(() => {
    document.body.classList.add('modo-carta')
    document.documentElement.classList.remove('en-portada', 'en-inicio')
    window.scrollTo(0, 0)
    return () => document.body.classList.remove('modo-carta')
  }, [])

  useEffect(() => {
    const motor = new MotorCarta(ref.current!, datos, {
      modo: ultimos.current.modo,
      desfase: ultimos.current.desfase,
      onEvento: (e) => ultimos.current.onEvento?.(e),
      onCerrar: () => ultimos.current.onCerrar?.(),
      onEstilo: (v) => ultimos.current.onEstilo?.(v),
      onRecargar: () => ultimos.current.onRecargar?.(),
    })
    return () => motor.destruir()
  }, [datos])

  return <div className="escena" ref={ref} />
}
