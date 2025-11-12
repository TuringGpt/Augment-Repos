import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  
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
    (set, get) => ({
      mode: 'light',
      
      setMode: (mode) => set({ mode }),
      
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'light' ? 'dark' : 'light' 
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
    const newMode = e.matches ? 'dark' : 'light'
    useThemeStore.getState().setMode(newMode)
  })
}

