export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type SortOrder = 'asc' | 'desc'

export interface SelectOption {
  label: string
  value: string | number
}

