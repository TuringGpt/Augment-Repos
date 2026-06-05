import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from '@/lib/axios';

/**
 * Custom storage implementation for Zustand persist middleware
 * that safely handles SSR/test/non-browser contexts
 */
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => {
    return safeGetLocalStorage(name);
  },
  setItem: (name: string, value: string): void => {
    safeSetLocalStorage(name, value);
  },
  removeItem: (name: string): void => {
    safeRemoveLocalStorage(name);
  },
}));

/**
 * Authentication store using Zustand
 *
 * Manages authentication state including:
 * - User authentication status
 * - User information
 * - Login/logout actions
 *
 * This store is persisted to localStorage to maintain auth state across sessions.
 */

export interface User {
  email: string;
  role: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  
  // Actions
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  checkAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: !!safeGetLocalStorage('access_token') && !!safeGetLocalStorage('refresh_token'),
      user: null,

      // Set authentication (called after successful login)
      setAuth: (accessToken: string, refreshToken: string, user: User) => {
        const accessTokenStored = safeSetLocalStorage('access_token', accessToken);
        const refreshTokenStored = safeSetLocalStorage('refresh_token', refreshToken);

        // Only set isAuthenticated to true if both tokens were successfully stored
        if (accessTokenStored && refreshTokenStored) {
          set({ isAuthenticated: true, user });
        } else {
          // If storage fails, clear any partial state and remain unauthenticated
          console.error('Failed to store authentication tokens. LocalStorage may be unavailable or blocked.');
          // Clean up any tokens that may have been partially stored to prevent desync
          safeRemoveLocalStorage('access_token');
          safeRemoveLocalStorage('refresh_token');
          set({ isAuthenticated: false, user: null });
        }
      },

      // Clear authentication (logout)
      clearAuth: () => {
        safeRemoveLocalStorage('access_token');
        safeRemoveLocalStorage('refresh_token');
        set({ isAuthenticated: false, user: null });
      },

      // Check authentication status (useful for refreshing state)
      checkAuth: () => {
        const accessToken = safeGetLocalStorage('access_token');
        const refreshToken = safeGetLocalStorage('refresh_token');
        if (accessToken && refreshToken) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false, user: null });
        }
      },

      // Update user information
      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: safeStorage, // Use safe storage to prevent crashes in SSR/test/non-browser contexts
      partialize: (state) => ({
        // Only persist user data, not isAuthenticated (derived from tokens)
        user: state.user,
      }),
      // Validate tokens on rehydration to prevent stale user data
      // If tokens were cleared externally (e.g., by 401 interceptor), clear persisted user data
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hasAccessToken = !!safeGetLocalStorage('access_token');
          const hasRefreshToken = !!safeGetLocalStorage('refresh_token');

          // If tokens are missing but user data exists, clear the user data
          // Directly clear state to avoid TDZ issues and ensure changes stick during hydration
          if (!hasAccessToken || !hasRefreshToken) {
            // Clear auth tokens from localStorage
            safeRemoveLocalStorage('access_token');
            safeRemoveLocalStorage('refresh_token');
            // Clear persisted user data
            safeRemoveLocalStorage('auth-storage');
            // Reset state to unauthenticated
            state.isAuthenticated = false;
            state.user = null;
          }
        }
      },
    }
  )
);
