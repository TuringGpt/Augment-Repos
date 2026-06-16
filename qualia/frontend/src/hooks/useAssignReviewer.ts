import { useMutation } from '@tanstack/react-query';
import { assignReviewer } from '@/services/formService';
import type { AssignReviewerRequest, AssignReviewerResponse } from '@/services/formService';
import type { ApiError } from '@/lib/axios';

/**
 * Variables for the assignReviewer mutation
 */
interface AssignReviewerVariables {
  formCycleId: string;
  data: AssignReviewerRequest;
}

/**
 * TanStack Query mutation hook for assigning a reviewer to a form cycle
 *
 * Disables retry to prevent duplicate reviewer assignment on transient
 * network failures (reviewer assignment is non-idempotent).
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useAssignReviewer({
 *   onSuccess: (data) => {
 *     console.log('Reviewer assigned:', data.reviewer_id);
 *     toast.success(`Reviewer assigned successfully to form cycle ${data.form_cycle_id}`);
 *   },
 *   onError: (error) => {
 *     console.error('Reviewer assignment failed:', error.message);
 *     toast.error(error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({
 *   formCycleId: "550e8400-e29b-41d4-a716-446655440000",
 *   data: {
 *     reviewer_id: "660e8400-e29b-41d4-a716-446655440001"
 *   }
 * });
 * ```
 */
export const useAssignReviewer = (options?: {
  onSuccess?: (data: AssignReviewerResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  return useMutation<AssignReviewerResponse, ApiError, AssignReviewerVariables>({
    mutationFn: ({ formCycleId, data }: AssignReviewerVariables) =>
      assignReviewer(formCycleId, data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent duplicate reviewer assignment on transient failures
    // Reviewer assignment is non-idempotent, so retrying could assign the same reviewer multiple times
    retry: false,
  });
};
