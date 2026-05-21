import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDamageReports } from './useDamageReports'
import type { ReactNode } from 'react'

const mockGetAll = vi.hoisted(() => vi.fn())

vi.mock('@/api/damage-reports', () => ({
  getAll: mockGetAll,
}))

vi.mock('@/components/map/demo-damage-data', () => ({
  demoDamageReports: [],
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useDamageReports', () => {
  it('returns damage reports on success', async () => {
    mockGetAll.mockResolvedValueOnce([{ id: '1', description: 'Fire damage' }])
    const { result } = renderHook(() => useDamageReports(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.damageReports).toEqual([{ id: '1', description: 'Fire damage' }])
    expect(result.current.demoMode).toBe(false)
  })

  it('falls back to demo data on error', async () => {
    mockGetAll.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useDamageReports(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.damageReports).toEqual([])
    expect(result.current.demoMode).toBe(true)
  })
})
