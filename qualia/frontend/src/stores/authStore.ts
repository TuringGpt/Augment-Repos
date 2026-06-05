import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from '@/lib/axios';

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
      isAuthenticated: !!safeGetLocalStorage('access_token'),
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
        const token = safeGetLocalStorage('access_token');
        set({ isAuthenticated: !!token });
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
      partialize: (state) => ({
        // Only persist user data, not isAuthenticated (derived from tokens)
        user: state.user,
      }),
    }
  )
);
