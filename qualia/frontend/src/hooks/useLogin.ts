import login from '@/services/authService';
import type { LoginRequest, Loginresponse } from '@/services/authService';
import type { apiError } from '@/lib/axios';

/**
 * TanStack Query mutation hook for user login
 *
 * Explicitly disables retry to prevent account lockout from
 * excessive failed login attempts.
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useLogin({
 *   onSuccess: (data) => {
 *     console.log('Login successful, tokens stored');
 *     navigate('/dashboard');
 *   },
 *   onError: (error) => {
 *     console.error('Login failed:', error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({ email: 'user@example.com', password: 'password123' });
 * ```
 */
export const useLogin = (options?: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent account lockout from excessive failed attempts
    retry: false,
  });
};
