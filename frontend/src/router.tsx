import { createBrowserRouter } from 'react-router'
import Inicio from './pages/Inicio'
import NoEncontrada from './pages/NoEncontrada'

// Fase 0: solo el esqueleto. Las rutas de ocasiones, armado y carta llegan en la Fase 1.
export const router = createBrowserRouter([
  { path: '/', element: <Inicio /> },
  { path: '*', element: <NoEncontrada /> },
])
