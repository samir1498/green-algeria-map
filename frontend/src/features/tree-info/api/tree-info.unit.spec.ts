import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchTreeSpecies, getTreeSpeciesDetail, getGbifObservations } from './tree-info'
import type { TreeSearchResult, TreeSpeciesDetail } from './tree-info'

const mockInaturalistGet = vi.hoisted(() => vi.fn())
const mockGbifGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: {
    create: (config: { baseURL: string }) => {
      if (config.baseURL.includes('gbif')) {
        return { get: mockGbifGet }
      }
      return { get: mockInaturalistGet }
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('searchTreeSpecies', () => {
  it('returns mapped results from iNaturalist autocomplete', async () => {
    mockInaturalistGet.mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 1,
            name: 'Cedrus atlantica',
            preferred_common_name: 'Atlas cedar',
            rank: 'species',
          },
          { id: 2, name: 'Pinus halepensis', preferred_common_name: null, rank: 'species' },
        ],
      },
    })

    const result: TreeSearchResult[] = await searchTreeSpecies('cedar')

    expect(mockInaturalistGet).toHaveBeenCalledWith('/taxa/autocomplete', {
      params: { q: 'cedar' },
    })
    expect(result).toEqual([
      { id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' },
      { id: 2, name: 'Pinus halepensis', commonName: null, rank: 'species' },
    ])
  })

  it('returns empty array when no results', async () => {
    mockInaturalistGet.mockResolvedValueOnce({ data: { results: [] } })

    const result = await searchTreeSpecies('zzzzz')

    expect(result).toEqual([])
  })
})

describe('getTreeSpeciesDetail', () => {
  it('returns detail from iNaturalist taxon endpoint', async () => {
    mockInaturalistGet.mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 1,
            name: 'Cedrus atlantica',
            wikipedia_url: 'https://en.wikipedia.org/wiki/Cedrus_atlantica',
            preferred_common_name: 'Atlas cedar',
            taxon_photos: [
              {
                photo: {
                  url: 'https://static.inaturalist.org/photos/1/square.jpg',
                  medium_url: 'https://static.inaturalist.org/photos/1/medium.jpg',
                },
              },
            ],
          },
        ],
      },
    })

    const result: TreeSpeciesDetail = await getTreeSpeciesDetail(1)

    expect(mockInaturalistGet).toHaveBeenCalledWith('/taxa/1')
    expect(result).toEqual({
      summary: '',
      photos: ['https://static.inaturalist.org/photos/1/square.jpg'],
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Cedrus_atlantica',
      commonName: 'Atlas cedar',
    })
  })

  it('returns empty values when no taxon found', async () => {
    mockInaturalistGet.mockResolvedValueOnce({ data: { results: [] } })

    const result = await getTreeSpeciesDetail(999)

    expect(result).toEqual({ summary: '', photos: [], wikipediaUrl: null, commonName: null })
  })

  it('handles missing photos gracefully', async () => {
    mockInaturalistGet.mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 1,
            name: 'Test',
            wikipedia_url: null,
            preferred_common_name: null,
          },
        ],
      },
    })

    const result = await getTreeSpeciesDetail(1)

    expect(result).toEqual({ summary: '', photos: [], wikipediaUrl: null, commonName: null })
  })
})

describe('getGbifObservations', () => {
  it('returns observation count for Algeria', async () => {
    mockGbifGet
      .mockResolvedValueOnce({
        data: {
          usageKey: 123,
          scientificName: 'Cedrus atlantica',
          rank: 'SPECIES',
          status: 'ACCEPTED',
        },
      })
      .mockResolvedValueOnce({
        data: { count: 42 },
      })

    const result = await getGbifObservations('Cedrus atlantica')

    expect(mockGbifGet).toHaveBeenNthCalledWith(1, '/species/match', {
      params: { name: 'Cedrus atlantica' },
    })
    expect(mockGbifGet).toHaveBeenNthCalledWith(2, '/occurrence/search', {
      params: { taxonKey: 123, country: 'DZ' },
    })
    expect(result).toBe(42)
  })

  it('returns null when species match fails', async () => {
    mockGbifGet.mockRejectedValueOnce(new Error('Network error'))

    const result = await getGbifObservations('Unknown species')

    expect(result).toBeNull()
  })

  it('returns null when usageKey is missing', async () => {
    mockGbifGet.mockResolvedValueOnce({
      data: {},
    })

    const result = await getGbifObservations('Whatever')

    expect(result).toBeNull()
  })
})
