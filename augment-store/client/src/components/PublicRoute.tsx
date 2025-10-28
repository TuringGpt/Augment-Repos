import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

/**
 * PublicRoute component
 * Redirects to home page if user is already authenticated
 * Used for auth routes that logged-in users shouldn't access (e.g., /login, /register)
 *
 * Note: Waits for Zustand persist hydration to complete before checking auth state
 * to prevent premature redirects on initial page load
 */
const PublicRoute = () => {
  const { isAuthenticated, hasHydrated } = useAuthStore()

  // Wait for persisted state to rehydrate before making routing decisions
  // This prevents redirecting authenticated users away from auth pages prematurely
  if (!hasHydrated) {
    return null // or a loading spinner
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}

export default PublicRoute
