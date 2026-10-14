import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
// Los estilos van en el mismo orden que en el prototipo para que la cascada sea igual.
import './styles/tokens.css'
import './styles/base.css'
import './carta/carta.css'
import './armar/armar.css'
import './pages/portada.css'
import './styles/temas.css'
import './pages/inicio.css'
import './pages/seguimiento.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
