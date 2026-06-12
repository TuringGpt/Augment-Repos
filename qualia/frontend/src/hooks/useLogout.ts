import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/services/authService';

/**
 * TanStack Query mutation hook for user logout
 *
 * Clears authentication tokens from localStorage, cancels all in-flight queries,
 * and clears all TanStack Query caches to prevent data leakage between user sessions.
 *
 * Security: Cancelling in-flight queries before clearing ensures that requests
 * started before logout cannot resolve and repopulate UI state/data after the
 * session has been cleared.
 *
 * @example
 * ```tsx
 * const { mutate: logoutUser, isPending } = useLogout({
 *   onSuccess: () => {
 *     console.log('Logout successful');
 *     navigate('/signin');
 *   },
 *   onError: (error) => {
 *     console.error('Logout failed:', error);
 *   }
 * });
 *
 * // Call the mutation
 * logoutUser();
 * ```
 */
export const useLogout = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      // Cancel all in-flight queries to prevent them from resolving after logout
      await queryClient.cancelQueries();

      // Clear all TanStack Query caches to prevent data leakage between user sessions
      queryClient.clear();

      // Call user's onSuccess callback if provided
      options?.onSuccess?.();
    },
    onError: options?.onError,
    // No retry needed for logout - it's a local operation
    retry: false,
  });
};
