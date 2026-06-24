import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { isAccessTokenExpired } from '@/lib/jwt';
import { safeRemoveLocalStorage } from '@/lib/axios';
import { ROUTES } from '@/config/routes';

/**
 * Hook to automatically check for token expiration and logout user
 * 
 * This hook runs a periodic check (every 30 seconds) to see if the access token
 * has expired. If the token is expired, it:
 * 1. Clears tokens from localStorage
 * 2. Cancels all in-flight queries
 * 3. Clears all TanStack Query caches
 * 4. Redirects to the sign-in page
 * 
 * This ensures that users are automatically logged out when their session expires,
 * even if they're idle and not making any API requests.
 * 
 * @example
 * ```tsx
 * function App() {
 *   useTokenExpirationCheck();
 *   return <AppRoutes />;
 * }
 * ```
 */
export function useTokenExpirationCheck() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isCheckingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const checkTokenExpiration = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) {
        return;
      }

      try {
        isCheckingRef.current = true;

        // Check if token is expired
        if (isAccessTokenExpired()) {
          // Clear tokens
          safeRemoveLocalStorage('access_token');
          safeRemoveLocalStorage('refresh_token');

          // Cancel all in-flight queries
          await queryClient.cancelQueries();

          // Clear all TanStack Query caches
          queryClient.clear();

          // Development logging
          if (import.meta.env.DEV) {
            console.log('Token expired - automatically logging out');
          }

          // Redirect to sign-in page
          navigate(ROUTES.SIGN_IN, { replace: true });
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Check immediately on mount
    checkTokenExpiration();

    // Set up periodic check every 30 seconds
    // 30 seconds is a good balance between responsiveness and performance
    intervalRef.current = window.setInterval(checkTokenExpiration, 30000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [navigate, queryClient]);
}
