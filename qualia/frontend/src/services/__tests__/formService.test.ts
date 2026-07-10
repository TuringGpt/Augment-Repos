import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: mockGet,
  },
}))

import { getAllForms, type AdminForm } from '@/services/formService'

describe('getAllForms', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('requests all forms from the admin endpoint', async () => {
    const forms: AdminForm[] = [
      {
        id: 'form-1',
        title: 'Q3 Review',
        description: 'Quarterly review cycle',
        status: 'active',
        is_published: true,
        submission_deadline: '2026-07-31T00:00:00Z',
        created_at: '2026-07-01T00:00:00Z',
      },
    ]
    mockGet.mockResolvedValue({ data: forms })

    await expect(getAllForms()).resolves.toEqual(forms)

    expect(mockGet).toHaveBeenCalledWith('/forms/all', { signal: undefined })
  })

  it('forwards an abort signal to the request', async () => {
    const signal = new AbortController().signal
    mockGet.mockResolvedValue({ data: [] })

    await getAllForms(signal)

    expect(mockGet).toHaveBeenCalledWith('/forms/all', { signal })
  })
})