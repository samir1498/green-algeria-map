import { test, expect, type Page } from '@playwright/test'

const INAT_BASE = 'https://api.inaturalist.org/v1'
const GBIF_BASE = 'https://api.gbif.org/v1'

async function clickZoneMarker(page: Page, name: string) {
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 30000 })
  const marker = page.getByTestId(`zone-marker-${name}`)
  await marker.waitFor({ state: 'visible', timeout: 15000 })
  await marker.dispatchEvent('click')
}

test.describe('Tree species info modal', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await page.route(`${INAT_BASE}/taxa/autocomplete*`, async (route) => {
      const url = new URL(route.request().url())
      const query = url.searchParams.get('q')
      if (query === 'Cedrus atlantica') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 123,
                name: 'Cedrus atlantica',
                preferred_common_name: 'Atlas cedar',
                rank: 'species',
              },
            ],
          }),
        })
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ results: [] }),
        })
      }
    })

    await page.route(`${INAT_BASE}/taxa/*`, async (route) => {
      const url = route.request().url()
      if (url.includes('/taxa/123')) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 123,
                name: 'Cedrus atlantica',
                wikipedia_url: 'https://en.wikipedia.org/wiki/Cedrus_atlantica',
                preferred_common_name: 'Atlas cedar',
                taxon_photos: [
                  {
                    photo: {
                      url: 'https://example.com/cedrus-atlantica.jpg',
                      medium_url: 'https://example.com/cedrus-atlantica-med.jpg',
                    },
                  },
                ],
              },
            ],
          }),
        })
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ results: [] }),
        })
      }
    })

    await page.route(`${GBIF_BASE}/species/match*`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          usageKey: 456,
          scientificName: 'Cedrus atlantica',
          rank: 'SPECIES',
          status: 'ACCEPTED',
        }),
      })
    })

    await page.route(`${GBIF_BASE}/occurrence/search*`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 42 }),
      })
    })

    await page.goto('/')
  })

  test('opens tree info modal from zone marker popup with GBIF data', async ({ page }) => {
    await clickZoneMarker(page, 'Chrea National Park')

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('tree-species-link')).toBeVisible()

    await popup.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('tree-info-gbif')).toContainText('42')
    await expect(page.getByTestId('tree-info-wikipedia')).toBeVisible()
  })

  test('tree info modal shows species name and common name', async ({ page }) => {
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('tree-info-scientific-name')).toHaveText('Cedrus atlantica')
    await expect(page.getByTestId('tree-info-common-name')).toHaveText('Atlas cedar')
  })

  test('tree info modal can be closed', async ({ page }) => {
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('tree-info-close').click()
    await expect(page.getByTestId('tree-info-content')).not.toBeVisible()
  })
})
