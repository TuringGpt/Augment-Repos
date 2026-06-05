import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { safeGetLocalStorage } from '@/lib/storage';

interface PublicRouteProps {
  children: ReactNode;
  redirectIfAuthenticated?: boolean;
}

/**
 * PublicRoute component
 * 
 * Wraps public routes (like sign-in, register) that should redirect
 * authenticated users to the dashboard.
 * 
 * This prevents users from accessing login/register pages when already logged in.
 * 
 * @example
 * ```tsx
 * <Route path="/signin" element={
 *   <PublicRoute redirectIfAuthenticated>
 *     <SignIn />
 *   </PublicRoute>
 * } />
 * ```
 */
export function PublicRoute({
  children,
  redirectIfAuthenticated = false
}: PublicRouteProps) {
  // Check if user is authenticated by verifying both tokens exist
  // Both access_token and refresh_token are required for consistent auth state
  // This matches the authentication definition in authStore
  const accessToken = safeGetLocalStorage('access_token');
  const refreshToken = safeGetLocalStorage('refresh_token');
  const isAuthenticated = !!accessToken && !!refreshToken;

  if (isAuthenticated && redirectIfAuthenticated) {
    // Redirect authenticated users to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
