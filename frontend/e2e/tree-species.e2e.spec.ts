import { test, expect, type Page } from '@playwright/test'
import { setupTreeApiMocks } from './helpers/mock-tree-api'

test.beforeEach(async ({ page }) => {
  await setupTreeApiMocks(page)
})

async function clickZoneMarker(page: Page, name: string) {
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 30000 })
  const marker = page.getByTestId(`zone-marker-${name}`)
  await marker.waitFor({ state: 'visible', timeout: 15000 })
  await marker.dispatchEvent('click')
}

test.describe('Tree species info modal', () => {
  test.use({ viewport: { width: 1280, height: 720 } })
  test.describe.configure({ retries: 3 })

  test('opens tree info modal from zone marker popup with GBIF data', async ({ page }) => {
    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('tree-species-link')).toBeVisible()

    await popup.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('tree-info-gbif')).toBeVisible()
    await expect(page.getByTestId('tree-info-wikipedia')).toBeVisible()
  })

  test('tree info modal shows species name and common name', async ({ page }) => {
    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('tree-info-scientific-name')).toHaveText('Cedrus atlantica')
    await expect(page.getByTestId('tree-info-common-name')).toBeVisible()
  })

  test('tree info modal can be closed', async ({ page }) => {
    await page.goto('/')
    await clickZoneMarker(page, 'Chrea National Park')

    await page.getByTestId('tree-species-link').click()
    await expect(page.getByTestId('tree-info-content')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('tree-info-close').click()
    await expect(page.getByTestId('tree-info-content')).not.toBeVisible()
  })
})
