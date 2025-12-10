import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

/**
 * AdminRoute component
 * Redirects to home if user is not authenticated or not an admin
 * Used for routes that require admin role (e.g., /admin/dashboard)
 *
 * Note: Waits for Zustand persist hydration to complete before checking auth state
 * to prevent premature redirects on initial page load
 */
const AdminRoute = () => {
  const { isAuthenticated, user, hasHydrated } = useAuthStore()

  // Wait for persisted state to rehydrate before making routing decisions
  // This prevents redirecting authenticated users prematurely
  if (!hasHydrated) {
    return null // or a loading spinner
  }

  // Check if user is authenticated and has admin role
  const isAdmin = isAuthenticated && user?.role === 'admin'

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

export default AdminRoute

