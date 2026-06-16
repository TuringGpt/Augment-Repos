import { useQuery } from '@tanstack/react-query';
import { getAssignedForms } from '@/services/formService';
import type { AssignedForm } from '@/services/formService';
import type { ApiError } from '@/lib/axios';
import { getUserFromToken } from '@/lib/jwt';

/**
 * TanStack Query hook for fetching assigned forms
 *
 * Fetches the list of forms assigned to the current user (reviewer).
 * Returns only active, published forms that have not been submitted yet
 * (filtering is performed server-side by the backend API).
 *
 * The query key is automatically scoped to the current user ID extracted from
 * the JWT token, ensuring that different users don't share cached data.
 *
 * **Authentication Required**: This hook automatically disables the query when
 * no JWT token is present or when the token cannot be decoded. The query
 * will only execute when a user ID can be extracted from the token's `sub` claim.
 * Note: This does not validate token expiration - expired tokens will still trigger
 * the query, and the backend is responsible for rejecting expired tokens.
 *
 * @param options.enabled - Optional manual control to disable the query. Defaults to true,
 *                          but the query will still be disabled if no valid user ID exists.
 *
 * @returns Query result with additional `isUnauthenticated` flag
 *          - `isUnauthenticated`: true when query is disabled due to missing/invalid user ID
 *          - All standard TanStack Query properties (data, isLoading, isError, error, refetch, etc.)
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch, isUnauthenticated } = useAssignedForms();
 *
 * // Handle unauthenticated state explicitly
 * if (isUnauthenticated) return <SignInPrompt />;
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

  // Defensively validate that userId is a non-empty string
  // This prevents issues if localStorage is corrupted/tampered and sub claim is non-string
  const userId = typeof user?.sub === 'string' && user.sub.trim() !== ''
    ? user.sub.trim()
    : undefined;

  // Only run the query if we have a valid user ID AND the enabled option allows it
  // This prevents unauthenticated requests and cache-sharing issues
  const isEnabled = options?.enabled !== false && !!userId;

  const queryResult = useQuery<AssignedForm[], ApiError>({
    queryKey: ['assignedForms', userId], // Scoped to user ID to prevent cache sharing between users
    queryFn: ({ signal }) => getAssignedForms(signal),
    enabled: isEnabled, // Only fetch when authenticated and not explicitly disabled
    // Query will automatically retry 3 times (from global config in queryClient.ts)
    // Data is considered fresh for 5 minutes (from global config)
    // Query will refetch on window focus in production (from global config)
  });

  return {
    ...queryResult,
    // Expose whether the query is disabled due to missing authentication
    // This allows UI components to distinguish between:
    // - Loading state (query enabled, data being fetched)
    // - Error state (query ran but failed)
    // - Unauthenticated state (query disabled, no valid user ID)
    // - Empty state (query succeeded but returned empty array)
    isUnauthenticated: !userId,
  };
};
