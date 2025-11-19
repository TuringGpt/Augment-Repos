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
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'

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

      initializeFromSystem: () => {
        const state = useThemeStore.getState()
        // Only initialize from system if user hasn't explicitly set a preference
        if (state.userPreference) {
          return // Early exit: user preference takes precedence, no update needed
        }
        const systemPreference = getSystemPreference()
        set({ mode: systemPreference })
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // After rehydration, initialize from system only if no user preference exists
        // This ensures we don't flash the wrong theme before rehydration completes
        if (state && !state.userPreference) {
          state.initializeFromSystem()
        }
      },
    }
  )
)

// Listen for system theme changes
// Guard against duplicate listeners during HMR and feature-detect matchMedia
if (typeof window !== 'undefined' && window.matchMedia) {
  const win = window as WindowWithThemeListener

  // Clean up existing listener if it exists (HMR cleanup)
  if (win.__themeStoreMediaQueryListener && win.__themeStoreMediaQuery) {
    const mq = win.__themeStoreMediaQuery
    // Feature detect: Safari < 14 only supports addListener/removeListener (deprecated but necessary)
    if (mq.removeEventListener) {
      mq.removeEventListener('change', win.__themeStoreMediaQueryListener)
    } else if (mq.removeListener) {
      mq.removeListener(win.__themeStoreMediaQueryListener)
    }
  }

  // Create and register new listener
  const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const state = useThemeStore.getState()

    // Only update if user hasn't explicitly set a preference
    if (!state.userPreference) {
      const newMode = e.matches ? 'dark' : 'light'
      // Use internal set to avoid marking as user preference
      useThemeStore.setState({ mode: newMode })
    }
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  // Feature detect: Safari < 14 only supports addListener/removeListener (deprecated but necessary)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemThemeChange)
  }

  // Store references for cleanup during HMR
  win.__themeStoreMediaQueryListener = handleSystemThemeChange
  win.__themeStoreMediaQuery = mediaQuery

  // Cleanup on module disposal (HMR)
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      // Feature detect: Safari < 14 only supports addListener/removeListener (deprecated but necessary)
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
      delete win.__themeStoreMediaQueryListener
      delete win.__themeStoreMediaQuery
    })
  }
}
