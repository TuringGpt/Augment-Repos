import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  deleteQuestion,
  type DeleteQuestionResponse,
} from "@/services/formService";
import type { ApiError } from "@/lib/axios";

/**
 * Variables for the deleteQuestion mutation
 */
interface DeleteQuestionVariables {
  formCycleId: string;
  sectionId: string;
  questionId: string;
}

/**
 * TanStack Query mutation hook for deleting a question from a section
 *
 * Disables retry to prevent duplicate delete attempts on transient
 * network failures (deletion is non-idempotent).
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useDeleteQuestion({
 *   onSuccess: (data) => {
 *     console.log('Question deleted:', data.message);
 *     toast.success('Question deleted successfully!');
 *     queryClient.invalidateQueries(['formCycle', formCycleId]);
 *   },
 *   onError: (error) => {
 *     console.error('Question deletion failed:', error.message);
 *     toast.error(error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({
 *   formCycleId: "550e8400-e29b-41d4-a716-446655440000",
 *   sectionId: "660e8400-e29b-41d4-a716-446655440002",
 *   questionId: "770e8400-e29b-41d4-a716-446655440003"
 * });
 * ```
 */
export const useDeleteQuestion = (options?: {
  onSuccess?: (data: DeleteQuestionResponse) => void;
  onError?: (error: ApiError) => void;
}): UseMutationResult<
  DeleteQuestionResponse,
  ApiError,
  DeleteQuestionVariables
> => {
  return useMutation<
    DeleteQuestionResponse,
    ApiError,
    DeleteQuestionVariables
  >({
    mutationFn: ({ formCycleId, sectionId, questionId }) =>
      deleteQuestion(formCycleId, sectionId, questionId),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent duplicate delete attempts on transient failures
    // Deletion is non-idempotent, so retrying could cause unexpected errors
    retry: false,
  });
};
