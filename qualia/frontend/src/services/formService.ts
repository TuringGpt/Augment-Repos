import { apiClient } from '@/lib/axios';

/**
 * Form Cycle API service
 * Handles form cycle creation and management
 */

// Type definitions matching backend API

/**
 * Request payload for creating a new form cycle
 */
export interface CreateFormCycleRequest {
  title: string;
  description?: string | null;
  submission_deadline: string; // ISO 8601 format with timezone (e.g., "2026-06-30T23:59:59+00:00")
}

/**
 * Response from creating a form cycle
 */
export interface CreateFormCycleResponse {
  id: string;
  status: string;
}

/**
 * Create a new form cycle
 * @param data - Form cycle data (title, description, submission_deadline)
 * @returns Promise with form cycle creation response
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, validation errors, permission errors, and server errors.
 * 
 * @example
 * ```typescript
 * const formCycle = await createFormCycle({
 *   title: "Q2 2026 QA Cycle",
 *   description: "Quarterly QA review for all team members",
 *   submission_deadline: "2026-06-30T23:59:59+00:00"
 * });
 * console.log(formCycle.id); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(formCycle.status); // "draft"
 * ```
 */
export const createFormCycle = async (data: CreateFormCycleRequest): Promise<CreateFormCycleResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Create form cycle request:', {
      endpoint: '/forms',
      title: data.title,
      deadline: data.submission_deadline
    });
  }

  const response = await apiClient.post<CreateFormCycleResponse>('/forms', data);

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Create form cycle response:', { 
      id: response.data.id,
      status: response.data.status
    });
  }

  return response.data;
};

/**
 * Request payload for assigning a reviewer to a form cycle
 */
export interface AssignReviewerRequest {
  reviewer_id: string;
}

/**
 * Response from assigning a reviewer to a form cycle
 */
export interface AssignReviewerResponse {
  message: string;
  form_cycle_id: string;
  reviewer_id: string;
}

/**
 * Assign a reviewer to a form cycle
 * @param formCycleId - The ID of the form cycle
 * @param data - Reviewer assignment data (reviewer_id)
 * @returns Promise with reviewer assignment response
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, validation errors, permission errors, and server errors.
 *
 * @example
 * ```typescript
 * const result = await assignReviewer("550e8400-e29b-41d4-a716-446655440000", {
 *   reviewer_id: "660e8400-e29b-41d4-a716-446655440001"
 * });
 * console.log(result.message); // "Reviewer assigned successfully"
 * console.log(result.form_cycle_id); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(result.reviewer_id); // "660e8400-e29b-41d4-a716-446655440001"
 * ```
 */
export const assignReviewer = async (
  formCycleId: number,
  data: AssignReviewerRequest
): Promise<Record<string, number>> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Assign reviewer request:', {
      endpoint: `/forms/${formCycleId}/assign-reviewer`,
      formCycleId: formCycleId,
      reviewerId: data.reviewer_id
    });
  }

  const response = await apiClient.post<AssignReviewerResponse>(
    `/forms/${formCycleId}/assign-reviewer`,
    data
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Assign reviewer response:', {
      message: response.data.message,
      formCycleId: response.data.form_cycle_id,
      reviewerId: response.data.reviewer_id
    });
  }

  return response.data;
};
