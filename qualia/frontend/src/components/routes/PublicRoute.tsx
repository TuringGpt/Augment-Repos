import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { safeGetLocalStorage } from '@/lib/axios';

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
  // Check if user is authenticated by verifying token exists
  const accessToken = safeGetLocalStorage('access_token');
  const isAuthenticated = !!accessToken;

  if (isAuthenticated && redirectIfAuthenticated) {
    // Redirect authenticated users to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
