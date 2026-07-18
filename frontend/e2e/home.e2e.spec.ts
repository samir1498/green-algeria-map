import { test, expect, type Page } from '@playwright/test'

async function clickZoneMarker(page: Page, name: string) {
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 30000 })
  const marker = page.getByTestId(`zone-marker-${name}`)
  await marker.waitFor({ state: 'visible', timeout: 15000 })
  await marker.dispatchEvent('click')
}

test.describe('Home page map interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('user clicks a zone marker and sees popup with CTA buttons', async ({ page }) => {
    await clickZoneMarker(page, 'Chrea National Park')

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('cta-volunteer')).toBeVisible()
    await expect(popup.getByTestId('cta-volunteer')).toHaveText('Volunteer')

    await popup.getByTestId('cta-volunteer').click()
    await expect(popup.getByTestId('cta-volunteer')).toHaveText('Joined', { timeout: 10000 })
    await expect(popup.getByText(/volunteers?/)).toBeVisible()
  })

  test('zone popup contains tree species link and report damage button', async ({ page }) => {
    await clickZoneMarker(page, 'Chrea National Park')

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('tree-species-link')).toBeVisible()
    await expect(popup.getByTestId('report-damage-button')).toBeVisible()
  })
})
