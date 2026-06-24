import { useEffect, useMemo, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { safeGetLocalStorage, safeRemoveLocalStorage } from '@/lib/axios';
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

  // Compute expiration status once to avoid decoding the JWT twice
  const tokenExpired = useMemo(
    () => accessToken ? isTokenExpired(accessToken) : false,
    [accessToken]
  );

  const isAuthenticated = !!accessToken && !tokenExpired;

  // Clear expired tokens in an effect to avoid side effects during render
  useEffect(() => {
    if (accessToken && tokenExpired) {
      safeRemoveLocalStorage('access_token');
      safeRemoveLocalStorage('refresh_token');
    }
  }, [accessToken, tokenExpired]);

  if (isAuthenticated && redirectIfAuthenticated) {
    // Redirect authenticated users to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
