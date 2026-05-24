import axios from 'axios'

const inaturalistApi = axios.create({
  baseURL: 'https://api.inaturalist.org/v1',
})

const gbifApi = axios.create({
  baseURL: 'https://api.gbif.org/v1',
})

export interface TreeSearchResult {
  id: number
  name: string
  commonName: string | null
  rank: string
}

export interface TreeSpeciesDetail {
  summary: string
  photos: string[]
  wikipediaUrl: string | null
  commonName: string | null
}

interface InaturalistAutocompleteResult {
  id: number
  name: string
  preferred_common_name: string | null
  rank: string
}

interface InaturalistTaxonResponse {
  results: Array<{
    id: number
    name: string
    wikipedia_url: string | null
    preferred_common_name: string | null
    taxon_photos: Array<{
      photo: {
        url: string
        medium_url: string
      }
    }>
  }>
}

interface GbifSpeciesMatchResponse {
  usageKey: number
  scientificName: string
  rank: string
  status: string
}

interface GbifOccurrenceResponse {
  count: number
}

export async function searchTreeSpecies(query: string): Promise<TreeSearchResult[]> {
  const { data } = await inaturalistApi.get<{
    results: InaturalistAutocompleteResult[]
  }>('/taxa/autocomplete', {
    params: { q: query },
  })

  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    commonName: r.preferred_common_name ?? null,
    rank: r.rank,
  }))
}

export async function getTreeSpeciesDetail(id: number): Promise<TreeSpeciesDetail> {
  const { data } = await inaturalistApi.get<InaturalistTaxonResponse>(`/taxa/${id}`)

  const taxon = data.results[0]

  if (!taxon) {
    return { summary: '', photos: [], wikipediaUrl: null, commonName: null }
  }

  return {
    summary: '',
    photos: taxon.taxon_photos?.map((tp) => tp.photo.url) ?? [],
    wikipediaUrl: taxon.wikipedia_url ?? null,
    commonName: taxon.preferred_common_name ?? null,
  }
}

export async function getGbifObservations(scientificName: string): Promise<number | null> {
  try {
    const { data: match } = await gbifApi.get<GbifSpeciesMatchResponse>('/species/match', {
      params: { name: scientificName },
    })

    if (!match.usageKey) return null

    const { data: occurrences } = await gbifApi.get<GbifOccurrenceResponse>('/occurrence/search', {
      params: { taxonKey: match.usageKey, country: 'DZ' },
    })

    return occurrences.count
  } catch {
    return null
  }
}
