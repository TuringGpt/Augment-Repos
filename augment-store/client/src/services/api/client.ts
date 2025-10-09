import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG, API_ENDPOINTS } from '@config/api'
import { useAuthStore } from '@store/authStore'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available from Zustand store
        const token = useAuthStore.getState().accessToken
        if (token) {
          // Ensure headers object exists before assigning
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Handle 401 errors (unauthorized)
        // Skip retry if this is already a retry attempt or if it's the refresh token endpoint
        const isRefreshTokenEndpoint = originalRequest.url?.includes(
          API_ENDPOINTS.AUTH.REFRESH_TOKEN
        )

        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshTokenEndpoint) {
          originalRequest._retry = true

          try {
            // Try to refresh token using a separate axios instance to avoid interceptor recursion
            const refreshToken = useAuthStore.getState().refreshToken
            if (refreshToken) {
              // Create a new axios instance without interceptors for the refresh call
              const refreshResponse = await axios.post(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
                { refreshToken },
                { headers: API_CONFIG.HEADERS }
              )
              const { accessToken } = refreshResponse.data

              // Update Zustand store with new access token
              useAuthStore.getState().setTokens(accessToken, refreshToken)

              // Retry original request with new token
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, logout and redirect to login
            useAuthStore.getState().logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config)
    return response.data
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()
