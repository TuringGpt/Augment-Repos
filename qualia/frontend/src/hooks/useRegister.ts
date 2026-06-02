import { useMutation } from '@tanstack/react-query';
import { register } from '@/services/authService';
import type { RegisterRequest, RegisterResponse } from '@/services/authService';
import type { ApiError } from '@/lib/axios';

/**
 * TanStack Query mutation hook for user registration
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useRegister({
 *   onSuccess: (data) => {
 *     console.log('Registration successful:', data.email);
 *     navigate('/signin');
 *   },
 *   onError: (error) => {
 *     console.error('Registration failed:', error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({ email: 'user@example.com', password: 'password123' });
 * ```
 */
export const useRegister = (options?: {
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
