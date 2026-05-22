import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useZones } from './useZones'
import type { ReactNode } from 'react'

const mockGetAll = vi.hoisted(() => vi.fn())

vi.mock('@/api/zones', () => ({
  getAll: mockGetAll,
}))

vi.mock('@/components/map/demo-data', () => ({
  demoZones: [],
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

describe('useZones', () => {
  it('returns zones on success', async () => {
    mockGetAll.mockResolvedValueOnce([{ id: '1', name: 'Zone A' }])
    const { result } = renderHook(() => useZones(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.zones).toEqual([{ id: '1', name: 'Zone A' }])
    expect(result.current.demoMode).toBe(false)
  })

  it('falls back to demo data on error', async () => {
    mockGetAll.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useZones(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.zones).toEqual([])
    expect(result.current.demoMode).toBe(true)
    expect(result.current.error).toBeDefined()
  })
})
