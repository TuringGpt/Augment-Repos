import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

/**
 * PublicRoute component
 * Redirects to home page if user is already authenticated
 * Used for auth routes that logged-in users shouldn't access (e.g., /login, /register)
 */
const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore()

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}

export default PublicRoute
