import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/services/authService';

/**
 * TanStack Query mutation hook for user logout
 *
 * Clears authentication tokens from localStorage and invalidates all
 * TanStack Query caches to prevent data leakage between user sessions.
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
    onSuccess: () => {
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
