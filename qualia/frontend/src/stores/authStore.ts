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
        safeSetLocalStorage('access_token', accessToken);
        safeSetLocalStorage('refresh_token', refreshToken);
        set({ isAuthenticated: true, user });
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
