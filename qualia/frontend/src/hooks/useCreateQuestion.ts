import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  createQuestion,
  type CreateQuestionRequest,
  type CreateQuestionResponse,
} from "@/services/formService";
import type { ApiError } from "@/lib/axios";

/**
 * Variables for the createQuestion mutation
 */
interface CreateQuestionVariables {
  formCycleId: string;
  sectionId: number;
  data: CreateQuestionRequest;
}

/**
 * TanStack Query mutation hook for creating a question in a section
 *
 * Disables retry to prevent duplicate question creation on transient
 * network failures (question creation is non-idempotent).
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useCreateQuestion({
 *   onSuccess: (data) => {
 *     console.log('Question created:', data.id);
 *     toast.success('Question created successfully!');
 *     queryClient.invalidateQueries(['formCycle', formCycleId]);
 *   },
 *   onError: (error) => {
 *     console.error('Question creation failed:', error.message);
 *     toast.error(error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({
 *   formCycleId: "550e8400-e29b-41d4-a716-446655440000",
 *   sectionId: "660e8400-e29b-41d4-a716-446655440002",
 *   data: {
 *     question_text: "What is your name?",
 *     question_type: QuestionType.SHORT_TEXT,
 *     is_required: true,
 *     display_order: 1
 *   }
 * });
 * ```
 */
export const useCreateQuestion = (options?: {
  onSuccess?: (data: CreateQuestionResponse) => void;
  onError?: (error: ApiError) => void;
}): UseMutationResult<
  CreateQuestionResponse,
  ApiError,
  CreateQuestionVariables
> => {
  return useMutation<
    CreateQuestionResponse,
    ApiError,
    CreateQuestionVariables
  >({
    mutationFn: ({ formCycleId, sectionId, data }) =>
      createQuestion(formCycleId, sectionId, data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent duplicate question creation on transient failures
    // Question creation is non-idempotent, so retrying could create multiple questions
    retry: false,
  });
};
