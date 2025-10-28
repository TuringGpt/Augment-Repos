import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

/**
 * ProtectedRoute component
 * Redirects to login if user is not authenticated
 * Used for routes that require authentication (e.g., /checkout, /orders, /profile)
 *
 * Note: Waits for Zustand persist hydration to complete before checking auth state
 * to prevent premature redirects on initial page load
 */
const ProtectedRoute = () => {
  const { isAuthenticated, hasHydrated } = useAuthStore()

  // Wait for persisted state to rehydrate before making routing decisions
  // This prevents redirecting authenticated users to /login on initial page load
  if (!hasHydrated) {
    return null // or a loading spinner
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
