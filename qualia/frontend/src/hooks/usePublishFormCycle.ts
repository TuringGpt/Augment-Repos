import { useMutation } from '@tanstack/react-query';
import { publishFormCycle } from '@/services/formService';
import type { PublishFormCycleResponse } from '@/services/formService';
import type { ApiError } from '@/lib/axios';

/**
 * TanStack Query mutation hook for publishing a form cycle
 *
 * Disables retry to prevent duplicate publish attempts on transient
 * network failures (publishing is non-idempotent).
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = usePublishFormCycle({
 *   onSuccess: (data) => {
 *     console.log('Form cycle published:', data.id);
 *     toast.success('Form cycle published successfully!');
 *     queryClient.invalidateQueries({ queryKey: ['formCycle', formCycleId] });
 *   },
 *   onError: (error) => {
 *     console.error('Form cycle publish failed:', error.message);
 *     toast.error(error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate("550e8400-e29b-41d4-a716-446655440000");
 * ```
 */
export const usePublishFormCycle = (options?: {
  onSuccess?: (data: PublishFormCycleResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  return useMutation<PublishFormCycleResponse, ApiError, string>({
    mutationFn: (formCycleId: string) => publishFormCycle(formCycleId),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent duplicate publish attempts on transient failures
    // Publishing is non-idempotent, so retrying could cause race conditions
    retry: false,
  });
};
