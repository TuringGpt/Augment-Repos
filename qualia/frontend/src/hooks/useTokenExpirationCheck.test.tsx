import { describe, it, expect, afterEach, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { act, render, waitFor } from '@/test/utils'
import { ROUTES } from '@/config/routes'
import { useTokenExpirationCheck } from './useTokenExpirationCheck'

const { mockNavigate, mockIsAccessTokenExpired, mockSafeRemoveLocalStorage } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockIsAccessTokenExpired: vi.fn(),
  mockSafeRemoveLocalStorage: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/jwt', () => ({
  isAccessTokenExpired: mockIsAccessTokenExpired,
}))

vi.mock('@/lib/storage', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage')>('@/lib/storage')
  return {
    ...actual,
    safeRemoveLocalStorage: mockSafeRemoveLocalStorage,
  }
})

function TestHarness() {
  useTokenExpirationCheck()
  return null
}

describe('useTokenExpirationCheck', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('logs the user out when the token expires during a later interval check', async () => {
    vi.useFakeTimers()

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    })
    const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries').mockResolvedValue(undefined)
    const clearSpy = vi.spyOn(queryClient, 'clear')

    mockNavigate.mockReset()
    mockSafeRemoveLocalStorage.mockReset()
    mockIsAccessTokenExpired.mockReset()
    mockIsAccessTokenExpired
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)

    render(<TestHarness />, { queryClient })

    await waitFor(() => {
      expect(mockIsAccessTokenExpired).toHaveBeenCalledTimes(1)
    })
    expect(mockNavigate).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SIGN_IN, { replace: true })
    })
    expect(mockSafeRemoveLocalStorage).toHaveBeenNthCalledWith(1, 'access_token')
    expect(mockSafeRemoveLocalStorage).toHaveBeenNthCalledWith(2, 'refresh_token')
    expect(cancelQueriesSpy).toHaveBeenCalledTimes(1)
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })
})