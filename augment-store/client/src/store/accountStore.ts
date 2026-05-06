import { create } from 'zustand'
import type { AdminUser } from '@features/accounts/types'

interface AccountState {
  // Admin users list state
  adminUsers: AdminUser[]
  total: number
  next: string | null
  previous: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setAdminUsers: (users: AdminUser[], count: number, next: string | null, previous: string | null) => void
  fetchAdminUsers: () => Promise<void>
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearAdminUsers: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  // Initial state
  adminUsers: [],
  total: 0,
  next: null,
  previous: null,
  isLoading: false,
  error: null,

  // Actions
  setAdminUsers: (users, count, next, previous) =>
    set({
      adminUsers: users,
      total: count,
      next,
      previous,
    }),

  fetchAdminUsers: async () => {
    try {
      set({ isLoading: true, error: null })
      // Import accountsService dynamically to avoid circular dependency
      const { accountsService } = await import('@services/api/accounts/accountsService')
      const response = await accountsService.getAdminUsers()
      set({
        adminUsers: response.users,
        total: response.count,
        next: response.next,
        previous: response.previous,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Failed to fetch admin users:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin users'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  clearAdminUsers: () =>
    set({
      adminUsers: [],
      total: 0,
      next: null,
      previous: null,
      error: null,
    }),
}))
