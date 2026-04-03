import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

/**
 * Currency type matching backend ListCurrencySerializer response
 * Backend returns: id, name, code, symbol, created_at, updated_at
 */
export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  created_at: string
  updated_at: string
}

/**
 * Currency list response
 */
export interface CurrencyListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Currency[]
}

/**
 * Create Currency Request
 * Backend expects fields for creating a new currency
 */
export interface CreateCurrencyRequest {
  code: string
  name: string
  symbol: string
}

/**
 * Create Currency Response
 * Backend CreateCurrencySerializer returns only basic fields without timestamps or id
 * Fields: name, code, symbol
 *
 * Note: This is different from Currency which includes id, created_at, and updated_at.
 * The CreateCurrencySerializer doesn't include these fields in the response.
 */
export interface CreateCurrencyResponse {
  code: string
  name: string
  symbol: string
}

/**
 * Update Currency Request
 * Backend expects fields for updating a currency
 * All fields are optional for partial updates (PATCH)
 */
export interface UpdateCurrencyRequest {
  code?: string
  name?: string
  symbol?: string
}

export const currencyService = {
  /**
   * Get all currencies
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with currency list
   * @throws Error if the API request fails
   */
  getCurrencies: async (signal?: AbortSignal): Promise<Currency[]> => {
    const response = await apiClient.get<CurrencyListResponse>(API_ENDPOINTS.CURRENCY.LIST, {
      signal,
    })
    return response.results
  },

  /**
   * Get a single currency by ID
   * @param id - Currency ID
   * @returns Promise with currency details (basic fields only: name, code, symbol)
   * @throws Error if the API request fails
   *
   * **ADMIN ONLY**: This endpoint requires admin authentication (AdminCurrencyUpdateDeleteView).
   * Calling this from non-admin client flows will result in a 403 Forbidden error.
   *
   * Note: Backend uses CreateCurrencySerializer which returns only name, code, and symbol.
   * It does NOT include id, created_at, or updated_at fields.
   */
  getCurrencyById: async (id: string): Promise<CreateCurrencyResponse> => {
    return apiClient.get<CreateCurrencyResponse>(API_ENDPOINTS.CURRENCY.DETAIL(id))
  },

  /**
   * Create a new currency
   * @param data - Currency data to create
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with created currency (basic fields only: name, code, symbol)
   * @throws Error if the API request fails
   *
   * **ADMIN ONLY**: This endpoint requires admin authentication (CreateCurrencyView).
   * Calling this from non-admin client flows will result in a 403 Forbidden error.
   *
   * Note: Backend CreateCurrencySerializer returns only name, code, and symbol.
   * It does NOT include id, created_at, or updated_at fields.
   */
  createCurrency: async (data: CreateCurrencyRequest, signal?: AbortSignal): Promise<CreateCurrencyResponse> => {
    return apiClient.post<CreateCurrencyResponse>(API_ENDPOINTS.CURRENCY.CREATE, data, {
      signal,
    })
  },

  /**
   * Update a currency by ID
   * @param id - Currency ID to update
   * @param data - Partial currency data to update
   * @returns Promise with updated currency (basic fields only: name, code, symbol)
   * @throws Error if the API request fails
   *
   * **ADMIN ONLY**: This endpoint requires admin authentication (AdminCurrencyUpdateDeleteView).
   * Calling this from non-admin client flows will result in a 403 Forbidden error.
   *
   * Note: Backend uses CreateCurrencySerializer which returns only name, code, and symbol.
   * It does NOT include id, created_at, or updated_at fields.
   */
  updateCurrency: async (id: string, data: UpdateCurrencyRequest): Promise<CreateCurrencyResponse> => {
    return apiClient.patch<CreateCurrencyResponse>(API_ENDPOINTS.CURRENCY.DETAIL(id), data)
  },

  /**
   * Delete a currency by ID
   * @param id - Currency ID to delete
   * @throws Error if the API request fails
   *
   * **ADMIN ONLY**: This endpoint requires admin authentication (AdminCurrencyUpdateDeleteView).
   * Calling this from non-admin client flows will result in a 403 Forbidden error.
   */
  deleteCurrency: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CURRENCY.DETAIL(id))
  },
}

