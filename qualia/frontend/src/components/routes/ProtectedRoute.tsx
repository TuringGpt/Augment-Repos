import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { safeGetLocalStorage } from '@/lib/storage';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component
 * 
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to the sign-in page.
 * Preserves the attempted URL to redirect back after login.
 * 
 * @example
 * ```tsx
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  // Check if user is authenticated by verifying both tokens exist
  // Both access_token and refresh_token are required for consistent auth state
  // This matches the authentication definition in authStore
  const accessToken = safeGetLocalStorage('access_token');
  const refreshToken = safeGetLocalStorage('refresh_token');
  const isAuthenticated = !!accessToken && !!refreshToken;

  if (!isAuthenticated) {
    // Redirect to sign-in page while preserving the attempted location
    // The user will be redirected back here after successful login
    return <Navigate to={ROUTES.SIGN_IN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
