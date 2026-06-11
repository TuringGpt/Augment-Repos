import { useMutation } from '@tanstack/react-query';
import { createFormCycle } from '@/services/formService';
import type { CreateFormCycleRequest, CreateFormCycleResponse } from '@/services/formService';
import type { ApiError } from '@/lib/axios';

/**
 * TanStack Query mutation hook for creating a form cycle
 *
 * Disables retry to prevent duplicate form cycle creation on transient
 * network failures (form cycle creation is non-idempotent).
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useCreateFormCycle({
 *   onSuccess: (data) => {
 *     console.log('Form cycle created:', data.id);
 *     toast.success(`Form cycle created with ID: ${data.id}`);
 *     navigate(`/dashboard/forms/${data.id}`);
 *   },
 *   onError: (error) => {
 *     console.error('Form cycle creation failed:', error.message);
 *     toast.error(error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({
 *   title: "Q2 2026 QA Cycle",
 *   description: "Quarterly QA review",
 *   submission_deadline: "2026-06-30T23:59:59+00:00"
 * });
 * ```
 */
export const useCreateFormCycle = (options?: {
  onSuccess?: (data: CreateFormCycleResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  return useMutation({
    mutationFn: (data: CreateFormCycleRequest) => createFormCycle(data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent duplicate form cycle creation on transient failures
    // Form cycle creation is non-idempotent, so retrying could create multiple cycles
    retry: false,
  });
};
