import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      partialize: (state) => ({
        // Only persist sidebar preference
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);
