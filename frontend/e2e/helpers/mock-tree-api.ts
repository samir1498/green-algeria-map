import { type Page } from '@playwright/test'

const MOCK_TAXA: Record<string, {
  id: number
  name: string
  commonName: string
  rank: string
  wikipediaUrl: string
}> = {
  'cedrus atlantica': {
    id: 136304,
    name: 'Cedrus atlantica',
    commonName: 'Atlas cedar',
    rank: 'species',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cedrus_atlantica',
  },
  'pinus halepensis': {
    id: 123456,
    name: 'Pinus halepensis',
    commonName: 'Aleppo pine',
    rank: 'species',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Pinus_halepensis',
  },
}

function findTaxonByQuery(query: string) {
  const q = query.toLowerCase()
  return Object.values(MOCK_TAXA).find(
    (t) => t.name.toLowerCase().includes(q) || t.commonName.toLowerCase().includes(q),
  )
}

function findTaxonById(id: number) {
  return Object.values(MOCK_TAXA).find((t) => t.id === id)
}

export async function setupTreeApiMocks(page: Page) {
  await page.route(/^https:\/\/api\.inaturalist\.org\/v1\/taxa\//, async (route) => {
    const url = new URL(route.request().url())
    const query = url.searchParams.get('q')

    if (url.pathname.endsWith('/autocomplete') && query) {
      const taxon = findTaxonByQuery(query)
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          results: taxon
            ? [
                {
                  id: taxon.id,
                  name: taxon.name,
                  preferred_common_name: taxon.commonName,
                  rank: taxon.rank,
                },
              ]
            : [],
        }),
      })
      return
    }

    const segments = url.pathname.split('/').filter(Boolean)
    const id = parseInt(segments[segments.length - 1], 10)
    const taxon = findTaxonById(id)

    if (!taxon) {
      await route.fulfill({ status: 404 })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: taxon.id,
            name: taxon.name,
            wikipedia_url: taxon.wikipediaUrl,
            preferred_common_name: taxon.commonName,
            taxon_photos: [],
          },
        ],
      }),
    })
  })

  await page.route(/^https:\/\/api\.gbif\.org\/v1\//, async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.includes('/species/match')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          usageKey: 567890,
          scientificName: url.searchParams.get('name') ?? '',
          rank: 'SPECIES',
          status: 'ACCEPTED',
        }),
      })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ count: 42 }),
    })
  })
}
