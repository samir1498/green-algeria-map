// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateDamageReport } from './useCreateDamageReport'
import type { ReactNode } from 'react'

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@/features/damage-reports/api/damage-reports', () => ({
  create: mockCreate,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const input = {
  zoneId: 'zone-1',
  type: 'fire' as const,
  severity: 'medium' as const,
  status: 'reported' as const,
  lat: 36.5,
  lng: 3.0,
  description: 'Fire damage',
  reportedBy: 'Volunteer-42',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCreateDamageReport', () => {
  it('calls create and shows success toast on success', async () => {
    mockCreate.mockResolvedValueOnce({ id: '1' })
    const { result } = renderHook(() => useCreateDamageReport(), { wrapper: createWrapper() })

    result.current.mutate(input)

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(input))

    const { toast } = await import('sonner')
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Damage report submitted')
  })

  it('shows error toast on failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCreateDamageReport(), { wrapper: createWrapper() })

    result.current.mutate(input)

    await waitFor(async () => {
      const { toast } = vi.mocked(await import('sonner'))
      expect(toast.error).toHaveBeenCalledWith('Failed to submit damage report')
    })
  })

  it('calls onSuccess callback when provided', async () => {
    mockCreate.mockResolvedValueOnce({ id: '1' })
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateDamageReport(onSuccess), {
      wrapper: createWrapper(),
    })

    result.current.mutate(input)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })
})
