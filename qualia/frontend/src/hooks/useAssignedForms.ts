import { useQuery } from '@tanstack/react-query';
import { getAssignedForms } from '@/services/formService';
import type { AssignedForm } from '@/services/formService';
import type { ApiError } from '@/lib/axios';

/**
 * TanStack Query hook for fetching assigned forms
 *
 * Fetches the list of forms assigned to the current user (reviewer).
 * Returns only active, published forms that have not been submitted yet.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useAssignedForms({
 *   onSuccess: (data) => {
 *     console.log('Assigned forms loaded:', data.length);
 *   },
 *   onError: (error) => {
 *     console.error('Failed to load assigned forms:', error.message);
 *     toast.error(error.message);
 *   }
 * });
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
  onSuccess?: (data: AssignedForm[]) => void;
  onError?: (error: ApiError) => void;
  enabled?: boolean; // Allow manual control of when the query runs
}) => {
  return useQuery<AssignedForm[], ApiError>({
    queryKey: ['assignedForms'], // Query key for caching and invalidation
    queryFn: () => getAssignedForms(),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    enabled: options?.enabled, // Defaults to true if not specified
    // Query will automatically retry 3 times (from global config in queryClient.ts)
    // Data is considered fresh for 5 minutes (from global config)
    // Query will refetch on window focus in production (from global config)
  });
};
