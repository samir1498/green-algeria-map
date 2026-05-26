import { test, expect } from '@playwright/test'

async function clickNthZoneMarker(page: import('@playwright/test').Page, index: number) {
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 30000 })
  const markers = page.locator('.leaflet-interactive')
  await markers.first().waitFor({ state: 'visible', timeout: 15000 })

  const clicked = await page.evaluate((idx) => {
    const marker = document.querySelectorAll('.leaflet-interactive')[idx] as SVGPathElement | null
    if (!marker) return false
    const rect = marker.getBoundingClientRect()
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    })
    marker.dispatchEvent(event)
    return true
  }, index)

  return clicked
}

test.describe('Home page map interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('user clicks a zone marker and sees popup with CTA and contact', async ({ page }) => {
    await clickNthZoneMarker(page, 2)

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('cta-volunteer')).toBeVisible()
    await expect(popup.getByTestId('cta-volunteer')).toHaveText('Volunteer')

    await popup.getByTestId('cta-volunteer').click()
    await expect(popup.getByText(/Contact:/)).toBeVisible()
  })

  test('zone popup contains tree species link and report damage button', async ({ page }) => {
    await clickNthZoneMarker(page, 2)

    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('tree-species-link')).toBeVisible()
    await expect(popup.getByTestId('report-damage-button')).toBeVisible()
  })
})
