import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'

/**
 * Create a new QueryClient for testing
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

/**
 * Wrapper component that includes all providers needed for testing
 */
function createAllTheProviders(queryClient: QueryClient) {
  return function AllTheProviders({ children }: AllTheProvidersProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            {children}
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

/**
 * Custom render function that wraps components with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient },
) => {
  const queryClient = options?.queryClient ?? createTestQueryClient()
  const { queryClient: _, ...renderOptions } = options ?? {}

  return render(ui, {
    wrapper: createAllTheProviders(queryClient),
    ...renderOptions
  })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render with custom render
export { customRender as render }
