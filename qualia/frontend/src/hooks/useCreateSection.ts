import { useMutation } from "@tanstack/react-query";
import {
  createSection,
  type CreateSectionRequest,
  type CreateSectionResponse,
} from "@/services/formService";
import type { ApiError } from "@/lib/axios";

/**
 * TanStack Query mutation hook for creating a section in a form cycle
 *
 * Disables retry to prevent duplicate section creation on transient
 * network failures (section creation is non-idempotent).
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useCreateSection({
 *   onSuccess: (data) => {
 *     console.log('Section created:', data.id);
 *     toast.success('Section created successfully!');
 *     queryClient.invalidateQueries(['formCycle', formCycleId]);
 *   },
 *   onError: (error) => {
 *     console.error('Section creation failed:', error.message);
 *     toast.error(error.message);
 *   }
 * });
 *
 * // Call the mutation
 * mutate({
 *   formCycleId: "550e8400-e29b-41d4-a716-446655440000",
 *   data: {
 *     title: "Personal Information",
 *     // Omit display_order to let backend auto-assign safely (prevents race conditions)
 *   }
 * });
 * ```
 */
export const useCreateSection = (options?: {
  onSuccess?: (data: CreateSectionResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  return useMutation<
    CreateSectionResponse,
    ApiError,
    { formCycleId: string; data: CreateSectionRequest }
  >({
    mutationFn: ({ formCycleId, data }) => createSection(formCycleId, data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    // Disable retry to prevent duplicate section creation on transient failures
    // Section creation is non-idempotent, so retrying could create multiple sections
    retry: false,
  });
};
