// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTreeInfo } from './useTreeInfo'
import type { ReactNode } from 'react'

const mockGetTreeSpeciesDetail = vi.hoisted(() => vi.fn())
const mockGetGbifObservations = vi.hoisted(() => vi.fn())

vi.mock('@/features/tree-info/api/tree-info', () => ({
  getTreeSpeciesDetail: mockGetTreeSpeciesDetail,
  getGbifObservations: mockGetGbifObservations,
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

describe('useTreeInfo', () => {
  it('does not fetch when taxonId is null', () => {
    const { result } = renderHook(() => useTreeInfo(null, null), { wrapper: createWrapper() })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetTreeSpeciesDetail).not.toHaveBeenCalled()
  })

  it('does not fetch when taxonId is 0', () => {
    const { result } = renderHook(() => useTreeInfo(0, null), { wrapper: createWrapper() })

    expect(result.current.isFetching).toBe(false)
  })

  it('fetches detail and GBIF count when taxonId is provided', async () => {
    mockGetTreeSpeciesDetail.mockResolvedValueOnce({
      summary: '',
      photos: ['https://example.com/photo.jpg'],
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
      commonName: 'Test common',
    })
    mockGetGbifObservations.mockResolvedValueOnce(42)

    const { result } = renderHook(() => useTreeInfo(1, 'Testus species'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetTreeSpeciesDetail).toHaveBeenCalledWith(1)
    expect(mockGetGbifObservations).toHaveBeenCalledWith('Testus species')
    expect(result.current.data).toEqual({
      summary: '',
      photos: ['https://example.com/photo.jpg'],
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
      commonName: 'Test common',
      gbifCount: 42,
    })
  })

  it('sets gbifCount to null when scientificName is null', async () => {
    mockGetTreeSpeciesDetail.mockResolvedValueOnce({
      summary: '',
      photos: [],
      wikipediaUrl: null,
      commonName: null,
    })

    const { result } = renderHook(() => useTreeInfo(1, null), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetGbifObservations).not.toHaveBeenCalled()
    expect(result.current.data?.gbifCount).toBeNull()
  })

  it('handles detail API failure gracefully', async () => {
    mockGetTreeSpeciesDetail.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTreeInfo(1, 'Testus species'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
