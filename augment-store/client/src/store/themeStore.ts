import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

// Extend Window interface for HMR listener tracking
interface WindowWithThemeListener extends Window {
  __themeStoreMediaQueryListener?: (e: MediaQueryListEvent) => void
  __themeStoreMediaQuery?: MediaQueryList
}

interface ThemeState {
  mode: ThemeMode
  userPreference: boolean // Track if user has explicitly set a preference

  // Actions
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  initializeFromSystem: () => void
}

// Detect system preference
const getSystemPreference = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light'

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  return mediaQuery.matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      userPreference: false,

      setMode: (mode) => set({ mode, userPreference: true }),

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
          userPreference: true,
        })),

      initializeFromSystem: () =>
        set((state) => {
          // Only initialize from system if user hasn't explicitly set a preference
          if (state.userPreference) {
            return state // No-op: user preference takes precedence
          }
          const systemPreference = getSystemPreference()
          return { mode: systemPreference }
        }),
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Listen for system theme changes
// Guard against duplicate listeners during HMR
if (typeof window !== 'undefined') {
  const win = window as WindowWithThemeListener

  // Clean up existing listener if it exists (HMR cleanup)
  if (win.__themeStoreMediaQueryListener && win.__themeStoreMediaQuery) {
    win.__themeStoreMediaQuery.removeEventListener('change', win.__themeStoreMediaQueryListener)
  }

  // Create and register new listener
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    const state = useThemeStore.getState()

    // Only update if user hasn't explicitly set a preference
    if (!state.userPreference) {
      const newMode = e.matches ? 'dark' : 'light'
      // Use internal set to avoid marking as user preference
      useThemeStore.setState({ mode: newMode })
    }
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleSystemThemeChange)

  // Store references for cleanup during HMR
  win.__themeStoreMediaQueryListener = handleSystemThemeChange
  win.__themeStoreMediaQuery = mediaQuery

  // Cleanup on module disposal (HMR)
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      delete win.__themeStoreMediaQueryListener
      delete win.__themeStoreMediaQuery
    })
  }
}
