import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'

// Lazy load devtools to prevent bundling in production
const ReactQueryDevtools =
  import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS === 'true'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((module) => ({
          default: module.ReactQueryDevtools,
        }))
      )
    : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
)
