import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { safeGetLocalStorage, safeRemoveLocalStorage } from '@/lib/storage';
import { isTokenExpired } from '@/lib/jwt';

interface PublicRouteProps {
  children: ReactNode;
  redirectIfAuthenticated?: boolean;
}

/**
 * PublicRoute component
 *
 * Wraps public routes (like sign-in, register) that should redirect
 * authenticated users to the dashboard.
 * Checks for token expiration and clears expired tokens.
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
  // Check if user is authenticated by verifying token exists and is not expired
  const accessToken = safeGetLocalStorage('access_token');
  const isAuthenticated = !!accessToken && !isTokenExpired(accessToken);

  // If token exists but is expired, clear it
  if (accessToken && isTokenExpired(accessToken)) {
    safeRemoveLocalStorage('access_token');
    safeRemoveLocalStorage('refresh_token');
  }

  if (isAuthenticated && redirectIfAuthenticated) {
    // Redirect authenticated users to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
