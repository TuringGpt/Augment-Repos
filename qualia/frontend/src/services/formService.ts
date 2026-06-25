import { apiClient } from "@/lib/axios";

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
export const createFormCycle = async (
  data: CreateFormCycleRequest,
): Promise<CreateFormCycleResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Create form cycle request:", {
      endpoint: "/forms",
      title: data.title,
      deadline: data.submission_deadline,
    });
  }

  const response = await apiClient.post<CreateFormCycleResponse>(
    "/forms",
    data,
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Create form cycle response:", {
      id: response.data.id,
      status: response.data.status,
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
  formCycleId: string,
  data: AssignReviewerRequest,
): Promise<AssignReviewerResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Assign reviewer request:", {
      endpoint: `/forms/${formCycleId}/assign-reviewer`,
      formCycleId: formCycleId,
      reviewerId: data.reviewer_id,
    });
  }

  const response = await apiClient.post<AssignReviewerResponse>(
    `/forms/${formCycleId}/assign-reviewer`,
    data,
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Assign reviewer response:", {
      message: response.data.message,
      formCycleId: response.data.form_cycle_id,
      reviewerId: response.data.reviewer_id,
    });
  }

  return response.data;
};

/**
 * Response from publishing a form cycle
 */
export interface PublishFormCycleResponse {
  id: string;
  status: string;
  is_published: boolean;
}

/**
 * Publish a form cycle
 * @param formCycleId - The ID of the form cycle
 * @returns Promise with publish response
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, validation errors, permission errors, and server errors.
 *
 * @example
 * ```typescript
 * const result = await publishFormCycle("550e8400-e29b-41d4-a716-446655440000");
 * console.log(result.id); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(result.status); // "active"
 * console.log(result.is_published); // true
 * ```
 */
export const publishFormCycle = async (
  formCycleId: string,
): Promise<PublishFormCycleResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Publish form cycle request:", {
      endpoint: `/forms/${formCycleId}/publish`,
      formCycleId: formCycleId,
    });
  }

  const response = await apiClient.post<PublishFormCycleResponse>(
    `/forms/${formCycleId}/publish`,
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Publish form cycle response:", {
      id: response.data.id,
      status: response.data.status,
      isPublished: response.data.is_published,
    });
  }

  return response.data;
};

/**
 * Assigned form item from the API
 */
export interface AssignedForm {
  id: string;
  title: string;
  description: string | null;
  submission_deadline: string; // ISO 8601 format with timezone
  submission_status: string | null;
}

/**
 * Get forms assigned to the current user (reviewer)
 * @param signal - Optional AbortSignal to cancel the request (provided by TanStack Query)
 * @returns Promise with array of assigned forms
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, authentication errors, and server errors.
 *
 * @example
 * ```typescript
 * const assignedForms = await getAssignedForms();
 * console.log(assignedForms.length); // Number of assigned forms
 * console.log(assignedForms[0].title); // "Q2 2026 QA Cycle"
 * console.log(assignedForms[0].submission_status); // "draft" or "in_progress" or null
 * ```
 */
export const getAssignedForms = async (
  signal?: AbortSignal,
): Promise<AssignedForm[]> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Get assigned forms request:", {
      endpoint: "/forms/assigned",
    });
  }

  const response = await apiClient.get<AssignedForm[]>("/forms/assigned", {
    signal,
  });

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Get assigned forms response:", {
      count: response.data.length,
    });
  }

  return response.data;
};

/**
 * Submission status values
 */
export const SubmissionStatus = {
  STARTED: "started",
  SUBMITTED: "submitted",
  DRAFT: "draft",
} as const;

export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus];

/**
 * Form submission item from the API (admin view)
 */
export interface FormSubmission {
  id: string;
  status: SubmissionStatus;
  started_at: string | null; // ISO 8601 format with timezone
  submitted_at: string | null; // ISO 8601 format with timezone
  reviewer_id: string;
  reviewer_email: string | null;
}

/**
 * Submission sort options for the API
 */
export const SubmissionSort = {
  STARTED_AT_ASC: "started_at_asc",
  STARTED_AT_DESC: "started_at_desc",
  SUBMITTED_AT_ASC: "submitted_at_asc",
  SUBMITTED_AT_DESC: "submitted_at_desc",
} as const;

export type SubmissionSort = typeof SubmissionSort[keyof typeof SubmissionSort];

/**
 * Get submissions for a specific form cycle (admin only)
 * @param formCycleId - The ID of the form cycle
 * @param options - Optional query parameters (status, sort, signal)
 * @returns Promise with array of form submissions
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, authentication errors, authorization errors, and server errors.
 *
 * @example
 * ```typescript
 * const submissions = await getFormSubmissions("550e8400-e29b-41d4-a716-446655440000");
 * console.log(submissions.length); // Number of submissions
 * console.log(submissions[0].status); // "submitted" or "started" or "draft"
 * console.log(submissions[0].reviewer_email); // "reviewer@example.com"
 *
 * // With filters
 * const submittedOnly = await getFormSubmissions(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   { status: SubmissionStatus.SUBMITTED, sort: SubmissionSort.SUBMITTED_AT_DESC }
 * );
 * ```
 */
export const getFormSubmissions = async (
  formCycleId: string,
  options?: {
    status?: SubmissionStatus;
    sort?: SubmissionSort;
    signal?: AbortSignal;
  },
): Promise<FormSubmission[]> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Get form submissions request:", {
      endpoint: `/forms/${formCycleId}/submissions`,
      formCycleId: formCycleId,
      status: options?.status,
      sort: options?.sort,
    });
  }

  // Build query parameters
  const params: Record<string, string> = {};
  if (options?.status) {
    params.status = options.status;
  }
  if (options?.sort) {
    params.sort = options.sort;
  }

  const response = await apiClient.get<FormSubmission[]>(
    `/forms/${formCycleId}/submissions`,
    {
      params,
      signal: options?.signal,
    },
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Get form submissions response:", {
      count: response.data.length,
    });
  }

  return response.data;
};

/**
 * Question from form cycle detail
 */
export interface FormDetailQuestion {
  id: string;
  question_type: string;
  question_text: string;
  description: string | null;
  is_required: boolean;
  display_order: number;
  config: Record<string, unknown>;
  conditional_logic: Record<string, unknown>;
}

/**
 * Section from form cycle detail
 */
export interface FormDetailSection {
  id: string;
  title: string | null;
  display_order: number;
  questions: FormDetailQuestion[];
}

/**
 * Form cycle detail response from API (admin/reviewer view)
 */
export interface FormCycleDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_published: boolean;
  submission_deadline: string; // ISO 8601 format with timezone
  sections: FormDetailSection[];
  created_at: string; // ISO 8601 format with timezone
  total_questions: number;
}

/**
 * Get a form cycle by ID (admin/reviewer access)
 * @param formCycleId - The ID of the form cycle
 * @param signal - Optional AbortSignal to cancel the request (provided by TanStack Query)
 * @returns Promise with form cycle details
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, authentication errors, authorization errors, and server errors.
 *
 * @example
 * ```typescript
 * const formCycle = await getFormCycleById("550e8400-e29b-41d4-a716-446655440000");
 * console.log(formCycle.title); // "Q2 2026 QA Cycle"
 * console.log(formCycle.status); // "draft" or "active" or "completed"
 * console.log(formCycle.total_questions); // 25
 * console.log(formCycle.sections.length); // 5
 * ```
 */
export const getFormCycleById = async (
  formCycleId: string,
  signal?: AbortSignal,
): Promise<FormCycleDetail> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Get form cycle by ID request:", {
      endpoint: `/forms/${formCycleId}`,
      formCycleId: formCycleId,
    });
  }

  const response = await apiClient.get<FormCycleDetail>(
    `/forms/${formCycleId}`,
    {
      signal,
    },
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Get form cycle by ID response:", {
      id: response.data.id,
      title: response.data.title,
      status: response.data.status,
      totalQuestions: response.data.total_questions,
      sectionsCount: response.data.sections.length,
    });
  }

  return response.data;
};

/**
 * Request payload for creating a section
 */
export interface CreateSectionRequest {
  title?: string | null;
  display_order?: number | null;
}

/**
 * Response from creating a section
 */
export interface CreateSectionResponse {
  id: string;
  form_cycle_id: string;
  title: string | null;
  display_order: number | null;
}

/**
 * Create a section for a form cycle
 * @param formCycleId - The ID of the form cycle
 * @param data - Section data (title, display_order)
 * @returns Promise with section creation response
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, validation errors, permission errors, and server errors.
 *
 * @example
 * ```typescript
 * // Omit display_order to let backend auto-assign safely (prevents race conditions)
 * const section = await createSection("550e8400-e29b-41d4-a716-446655440000", {
 *   title: "Personal Information",
 * });
 * console.log(section.id); // "660e8400-e29b-41d4-a716-446655440002"
 * console.log(section.form_cycle_id); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(section.title); // "Personal Information"
 * console.log(section.display_order); // 1 (auto-assigned by backend)
 * ```
 */
export const createSection = async (
  formCycleId: string,
  data: CreateSectionRequest,
): Promise<CreateSectionResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Create section request:", {
      endpoint: `/forms/${formCycleId}/sections`,
      formCycleId: formCycleId,
      title: data.title,
      displayOrder: data.display_order,
    });
  }

  const response = await apiClient.post<CreateSectionResponse>(
    `/forms/${formCycleId}/sections`,
    data,
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Create section response:", {
      id: response.data.id,
      formCycleId: response.data.form_cycle_id,
      title: response.data.title,
      displayOrder: response.data.display_order,
    });
  }

  return response.data;
};

/**
 * Question type values matching backend QuestionType enum
 */
export const QuestionType = {
  SHORT_TEXT: "short_text",
  LONG_TEXT: "long_text",
  NUMBER: "number",
  SINGLE_CHOICE: "single_choice",
  MULTIPLE_CHOICE: "multiple_choice",
  DROPDOWN: "dropdown",
  RATING: "rating",
  YES_NO_NA: "yes_no_na",
  FILE_UPLOAD: "file_upload",
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

/**
 * Request payload for creating a question
 */
export interface CreateQuestionRequest {
  question_text: string;
  question_type: QuestionType;
  is_required?: boolean;
  config?: Record<string, unknown>;
  conditional_logic?: Record<string, unknown> | null;
  display_order?: number | null;
  version?: number;
}

/**
 * Response from creating a question
 */
export interface CreateQuestionResponse {
  id: string;
  form_cycle_id: string;
  section_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  config: Record<string, unknown>;
  conditional_logic: Record<string, unknown>;
  display_order: number;
  version: number;
}

/**
 * Create a question for a section in a form cycle
 * @param formCycleId - The ID of the form cycle
 * @param sectionId - The ID of the section
 * @param data - Question data (question_text, question_type, is_required, etc.)
 * @returns Promise with question creation response
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, validation errors, permission errors, and server errors.
 *
 * @example
 * ```typescript
 * const question = await createQuestion(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   "660e8400-e29b-41d4-a716-446655440002",
 *   {
 *     question_text: "What is your name?",
 *     question_type: QuestionType.SHORT_TEXT,
 *     is_required: true,
 *     display_order: 1
 *   }
 * );
 * console.log(question.id); // "770e8400-e29b-41d4-a716-446655440003"
 * console.log(question.form_cycle_id); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(question.section_id); // "660e8400-e29b-41d4-a716-446655440002"
 * console.log(question.question_text); // "What is your name?"
 * console.log(question.is_required); // true
 * ```
 */
export const createQuestion = async (
  formCycleId: string,
  sectionId: string,
  data: CreateQuestionRequest,
): Promise<CreateQuestionResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Create question request:", {
      endpoint: `/forms/${formCycleId}/sections/${sectionId}/questions`,
      formCycleId: formCycleId,
      sectionId: sectionId,
      questionText: data.question_text,
      questionType: data.question_type,
      isRequired: data.is_required,
    });
  }

  const response = await apiClient.post<CreateQuestionResponse>(
    `/forms/${formCycleId}/sections/${sectionId}/questions`,
    data,
  );

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log("Create question response:", {
      id: response.data.id,
      formCycleId: response.data.form_cycle_id,
      sectionId: response.data.section_id,
      questionText: response.data.question_text,
      questionType: response.data.question_type,
      displayOrder: response.data.display_order,
    });
  }

  return response.data;
};
