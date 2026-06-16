import { useQuery } from '@tanstack/react-query';
import { getFormSubmissions } from '@/services/formService';
import type { FormSubmission, SubmissionSort, SubmissionStatus } from '@/services/formService';
import type { ApiError } from '@/lib/axios';

/**
 * TanStack Query hook for fetching form submissions
 *
 * Fetches the list of submissions for a specific form cycle (admin only).
 * This endpoint requires admin authentication and will return 403 for non-admin users.
 *
 * The query key is automatically scoped to the form cycle ID and filter parameters,
 * ensuring proper cache management when filters change.
 *
 * **Authentication & Authorization Required**: This hook requires a valid JWT token
 * with admin privileges. The query will execute even without authentication, but the
 * backend will reject unauthorized requests with 401/403 errors.
 *
 * @param formCycleId - The ID of the form cycle to fetch submissions for
 * @param options.status - Optional filter to show only submissions with a specific status
 * @param options.sort - Optional sort order for submissions (default: submitted_at_asc)
 * @param options.enabled - Optional manual control to disable the query. Defaults to true
 *                          when formCycleId is provided.
 *
 * @returns Query result with standard TanStack Query properties
 *          - All standard TanStack Query properties (data, isLoading, isError, error, refetch, etc.)
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useFormSubmissions(
 *   "550e8400-e29b-41d4-a716-446655440000"
 * );
 *
 * if (isLoading) return <Spinner />;
 * if (isError) return <ErrorMessage message={error.message} />;
 *
 * return (
 *   <div>
 *     <h2>Submissions ({data?.length || 0})</h2>
 *     {data?.map(submission => (
 *       <div key={submission.id}>
 *         <p>Reviewer: {submission.reviewer_email}</p>
 *         <p>Status: {submission.status}</p>
 *         <p>Submitted: {submission.submitted_at || 'Not submitted'}</p>
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With filters
 * const { data } = useFormSubmissions(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   {
 *     status: SubmissionStatus.SUBMITTED,
 *     sort: SubmissionSort.SUBMITTED_AT_DESC
 *   }
 * );
 * ```
 */
export const useFormSubmissions = (
  formCycleId: string,
  options?: {
    status?: SubmissionStatus;
    sort?: SubmissionSort;
    enabled?: boolean;
  }
) => {
  // Only run the query if we have a valid form cycle ID AND the enabled option allows it
  const isEnabled = options?.enabled !== false && !!formCycleId;

  return useQuery<FormSubmission[], ApiError>({
    // Query key includes form cycle ID and filter parameters for proper cache scoping
    queryKey: ['formSubmissions', formCycleId, options?.status, options?.sort],
    queryFn: ({ signal }) => getFormSubmissions(formCycleId, {
      status: options?.status,
      sort: options?.sort,
      signal,
    }),
    enabled: isEnabled,
    // Query will automatically retry 3 times (from global config in queryClient.ts)
    // Data is considered fresh for 5 minutes (from global config)
    // Query will refetch on window focus in production (from global config)
  });
};
