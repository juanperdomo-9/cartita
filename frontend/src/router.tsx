import { createBrowserRouter } from 'react-router'
import Armar from './armar/Armar'
import { CartaAdmin, CartaElla } from './pages/Carta'
import EditarCarta from './pages/EditarCarta'
import Ejemplo from './pages/Ejemplo'
import Familia from './pages/Familia'
import Inicio from './pages/Inicio'
import NoEncontrada from './pages/NoEncontrada'
import PortadaDiaMadre from './pages/PortadaDiaMadre'
import Seguimiento from './pages/Seguimiento'
import { diaMadre } from './ocasiones/diaMadre'

// Cada ocasión activa suma acá su portada, su armado y su ejemplo.
// Los links de la carta (/c, /s, /e) no cambian según la ocasión.
export const router = createBrowserRouter([
  { path: '/', element: <Inicio /> },
  { path: diaMadre.ruta, element: <PortadaDiaMadre /> },
  { path: diaMadre.ruta + '/crear', element: <Armar ocasion={diaMadre} /> },
  { path: diaMadre.ruta + '/ejemplo', element: <Ejemplo ocasion={diaMadre} /> },
  { path: '/c/:slug', element: <CartaElla /> },
  { path: '/s/:token', element: <Familia /> },
  { path: '/e/:token', element: <Seguimiento /> },
  { path: '/e/:token/carta', element: <CartaAdmin /> },
  { path: '/e/:token/editar', element: <EditarCarta /> },
  { path: '*', element: <NoEncontrada /> },
])
