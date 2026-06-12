import { useQuery } from '@tanstack/react-query';
import { getAssignedForms } from '@/services/formService';
import type { AssignedForm } from '@/services/formService';
import type { ApiError } from '@/lib/axios';
import { getUserFromToken } from '@/lib/jwt';

/**
 * TanStack Query hook for fetching assigned forms
 *
 * Fetches the list of forms assigned to the current user (reviewer).
 * Returns only active, published forms that have not been submitted yet.
 *
 * The query key is automatically scoped to the current user ID extracted from
 * the JWT token, ensuring that different users don't share cached data.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useAssignedForms();
 *
 * // Access the data
 * if (isLoading) return <Spinner />;
 * if (isError) return <ErrorMessage message={error.message} />;
 *
 * return (
 *   <div>
 *     <h2>My Assigned Forms ({data?.length || 0})</h2>
 *     {data?.map(form => (
 *       <div key={form.id}>
 *         <h3>{form.title}</h3>
 *         <p>{form.description}</p>
 *         <p>Deadline: {form.submission_deadline}</p>
 *         <p>Status: {form.submission_status || 'Not started'}</p>
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useAssignedForms = (options?: {
  enabled?: boolean; // Allow manual control of when the query runs
}) => {
  // Get current user ID from JWT token to scope the cache key
  // This ensures each user's assigned forms are cached separately
  const user = getUserFromToken();
  const userId = user?.sub || 'anonymous';

  return useQuery<AssignedForm[], ApiError>({
    queryKey: ['assignedForms', userId], // Scoped to user ID to prevent cache sharing between users
    queryFn: () => getAssignedForms(),
    enabled: options?.enabled, // Defaults to true if not specified
    // Query will automatically retry 3 times (from global config in queryClient.ts)
    // Data is considered fresh for 5 minutes (from global config)
    // Query will refetch on window focus in production (from global config)
  });
};
