import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'

/**
 * ProtectedRoute component
 * Redirects to login if user is not authenticated
 * Used for routes that require authentication (e.g., /checkout, /orders, /profile)
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore()

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute

