import { useEffect, useMemo, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { safeGetLocalStorage, safeRemoveLocalStorage } from '@/lib/axios';
import { isTokenExpired } from '@/lib/jwt';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component
 *
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to the sign-in page.
 * Checks for token expiration and clears expired tokens.
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

  if (!isAuthenticated) {
    // Redirect to sign-in page while preserving the attempted location
    // The user will be redirected back here after successful login
    return <Navigate to={ROUTES.SIGN_IN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
