import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from '@/lib/storage';

/**
 * Custom storage implementation for Zustand persist middleware
 * that safely handles SSR/test/non-browser contexts
 */
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => {
    return safeGetLocalStorage(name);
  },
  setItem: (name: string, value: string): void => {
    // Silently fail if localStorage is unavailable/blocked
    // Zustand will gracefully fall back to in-memory state
    safeSetLocalStorage(name, value);
  },
  removeItem: (name: string): void => {
    safeRemoveLocalStorage(name);
  },
}));

/**
 * UI store using Zustand
 *
 * Manages UI-related state including:
 * - Sidebar visibility (mobile)
 * - Theme preferences (if needed beyond next-themes)
 * - Modal states
 * - Loading states
 *
 * This store is persisted to localStorage to maintain UI preferences.
 */

interface UIState {
  // Sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Modal state (generic)
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar state - default to open on desktop, closed on mobile
      // Safe guard for SSR/test environments where window is undefined
      isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),

      // Modal state
      activeModal: null,
      openModal: (modalId: string) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),

      // Global loading state
      globalLoading: false,
      setGlobalLoading: (isLoading: boolean) => set({ globalLoading: isLoading }),
    }),
    {
      name: 'ui-storage', // localStorage key
      storage: safeStorage, // Use safe storage to prevent crashes in SSR/test/non-browser contexts
      partialize: (state) => ({
        // Only persist sidebar preference
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);
