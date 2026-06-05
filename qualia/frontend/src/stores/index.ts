/**
 * Central export for all Zustand stores
 * 
 * This file provides a single import point for all stores in the application.
 * 
 * @example
 * ```tsx
 * import { useAuthStore, useUIStore } from '@/stores';
 * 
 * function MyComponent() {
 *   const { isAuthenticated, clearAuth } = useAuthStore();
 *   const { isSidebarOpen, toggleSidebar } = useUIStore();
 *   
 *   // Use the store values and actions
 * }
 * ```
 */

export { useAuthStore } from './authStore';
export type { User } from './authStore';

export { useUIStore } from './uiStore';
