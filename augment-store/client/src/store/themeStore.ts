import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

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

      initializeFromSystem: () => {
        const systemPreference = getSystemPreference()
        set({ mode: systemPreference })
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  mediaQuery.addEventListener('change', (e) => {
    const state = useThemeStore.getState()

    // Only update if user hasn't explicitly set a preference
    if (!state.userPreference) {
      const newMode = e.matches ? 'dark' : 'light'
      // Use internal set to avoid marking as user preference
      useThemeStore.setState({ mode: newMode })
    }
  })
}
