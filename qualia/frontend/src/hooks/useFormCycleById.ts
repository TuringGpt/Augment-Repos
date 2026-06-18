import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getFormCycleById } from "@/services/formService";
import type { FormCycleDetail } from "@/services/formService";
import type { ApiError } from "@/lib/axios";

/**
 * TanStack Query hook for fetching a form cycle by ID
 *
 * This hook fetches detailed information about a specific form cycle,
 * including all sections and questions. It's used for both admin and
 * reviewer views when viewing form cycle details.
 *
 * The query is automatically enabled when formCycleId is provided and
 * can be manually controlled via the enabled option.
 *
 * @param formCycleId - The ID of the form cycle to fetch. Query is disabled if null/undefined.
 * @param options - Optional configuration
 * @param options.enabled - Optional manual control to disable the query. Defaults to true
 *                          when formCycleId is provided.
 *
 * @returns Query result with standard TanStack Query properties
 *          - All standard TanStack Query properties (data, isLoading, isError, error, refetch, etc.)
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useFormCycleById(
 *   "550e8400-e29b-41d4-a716-446655440000"
 * );
 *
 * if (isLoading) return <Spinner />;
 * if (isError) return <ErrorMessage message={error.message} />;
 *
 * return (
 *   <div>
 *     <h1>{data?.title}</h1>
 *     <p>{data?.description}</p>
 *     <p>Status: {data?.status}</p>
 *     <p>Total Questions: {data?.total_questions}</p>
 *     <p>Sections: {data?.sections.length}</p>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With manual enabled control
 * const { data, isLoading } = useFormCycleById(formCycleId, {
 *   enabled: !!formCycleId && userHasPermission
 * });
 * ```
 */
export const useFormCycleById = (
  formCycleId: string | null | undefined,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<FormCycleDetail, ApiError> => {
  // Only run the query if we have a valid form cycle ID AND the enabled option allows it
  const isEnabled = options?.enabled !== false && !!formCycleId;

  return useQuery<FormCycleDetail, ApiError>({
    // Query key includes form cycle ID for proper cache scoping
    queryKey: ["formCycle", formCycleId],
    queryFn: ({ signal }) => getFormCycleById(formCycleId!, signal),
    enabled: isEnabled,
    // Query will automatically retry 3 times (from global config in queryClient.ts)
    // Data is considered fresh for 5 minutes (from global config)
    // Query will refetch on window focus in production (from global config)
  });
};
