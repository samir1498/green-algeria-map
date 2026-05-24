// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTreeSearch } from './useTreeSearch'
import type { ReactNode } from 'react'

const mockSearchTreeSpecies = vi.hoisted(() => vi.fn())

vi.mock('@/features/tree-info/api/tree-info', () => ({
  searchTreeSpecies: mockSearchTreeSpecies,
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

describe('useTreeSearch', () => {
  it('does not fetch when query is shorter than 2 characters', () => {
    const { result } = renderHook(() => useTreeSearch('a'), { wrapper: createWrapper() })

    expect(result.current.isFetching).toBe(false)
    expect(mockSearchTreeSpecies).not.toHaveBeenCalled()
  })

  it('does not fetch when query is empty', () => {
    const { result } = renderHook(() => useTreeSearch(''), { wrapper: createWrapper() })

    expect(result.current.isFetching).toBe(false)
  })

  it('fetches results when query has at least 2 characters', async () => {
    mockSearchTreeSpecies.mockResolvedValueOnce([
      { id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' },
    ])

    const { result } = renderHook(() => useTreeSearch('ce'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockSearchTreeSpecies).toHaveBeenCalledWith('ce')
    expect(result.current.data).toEqual([
      { id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' },
    ])
  })

  it('returns empty array when no results match', async () => {
    mockSearchTreeSpecies.mockResolvedValueOnce([])

    const { result } = renderHook(() => useTreeSearch('zz'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('stores data in the correct queryKey cache', async () => {
    mockSearchTreeSpecies.mockResolvedValueOnce([
      { id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' },
    ])

    const { result } = renderHook(() => useTreeSearch('cedar'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([
      { id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' },
    ])
  })
})
