import { test, expect } from '@playwright/test'

// @real-api smoke tests — no mocks, hits real iNaturalist/GBIF APIs
// Skip in CI (external API rate limiting), run locally

test.skip(!!process.env.CI, 'External API — skip in CI')

async function clickZoneMarker(page: import('@playwright/test').Page, name: string) {
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 30000 })
  const marker = page.getByTestId(`zone-marker-${name}`)
  await marker.waitFor({ state: 'visible', timeout: 15000 })
  await marker.dispatchEvent('click')
}

test.describe('Tree species info modal — real API (@real-api)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })
  test.describe.configure({ retries: 0, timeout: 60_000 })

  test('opens tree info modal from zone marker popup with real API data', async ({ page }) => {
    test.info().annotations.push({ type: 'real-api', description: 'Hits iNaturalist/GBIF live endpoints' })

    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('tree-species-link')).toBeVisible()

    await popup.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 20000 })
  })

  test('tree info modal shows species name from real API', async ({ page }) => {
    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 20000 })

    // Scientific name should be non-empty string from real data
    const sciName = page.getByTestId('tree-info-scientific-name')
    await expect(sciName).toBeVisible()
    const text = await sciName.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('tree info modal shows GBIF link from real API', async ({ page }) => {
    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('tree-info-gbif')).toBeVisible()
  })

  test('tree info modal shows Wikipedia link from real API', async ({ page }) => {
    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('tree-info-wikipedia')).toBeVisible()
  })
})