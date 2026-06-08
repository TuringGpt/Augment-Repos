import { useMutation } from '@tanstack/react-query';
import { logout } from '@/services/authService';

/**
 * TanStack Query mutation hook for user logout
 *
 * Clears authentication tokens from localStorage and optionally
 * performs any additional cleanup or API calls needed during logout.
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
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // No retry needed for logout - it's a local operation
    retry: false,
  });
};
