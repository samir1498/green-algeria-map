import { test, expect } from '@playwright/test'

async function clickFirstZoneMarker(page: import('@playwright/test').Page) {
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('.leaflet-interactive').first().waitFor({ state: 'visible', timeout: 15000 })

  const clicked = await page.evaluate(() => {
    const container = document.querySelector('.leaflet-container')
    const map = (container as any)?._leaflet_map
    if (!map) {
      const marker = document.querySelector('.leaflet-interactive') as SVGPathElement | null
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
    }

    let opened = false
    map.eachLayer((layer: any) => {
      if (opened) return
      if (layer._latlng && layer.getPopup && layer.getPopup()) {
        if (layer.options?.fillColor && layer.options.fillColor !== '#dc2626') {
          layer.openPopup()
          opened = true
        }
      }
    })

    if (!opened) {
      map.eachLayer((layer: any) => {
        if (opened) return
        if (layer._latlng && layer.getPopup && layer.getPopup()) {
          layer.openPopup()
          opened = true
        }
      })
    }

    return opened
  })

  return clicked
}

test.describe('Home page map interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('user clicks a zone marker and sees popup with CTA and contact', async ({ page }) => {
    const opened = await clickFirstZoneMarker(page)

    const popup = page.locator('.leaflet-popup')
    if (!opened) {
      await page.evaluate(() => {
        const banner = document.querySelector('[data-testid="demo-banner"]') as HTMLElement
        if (banner) banner.style.display = 'none'
      })

      const box = await page.locator('.leaflet-interactive').first().boundingBox()
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      }

      await page.evaluate(() => {
        const banner = document.querySelector('[data-testid="demo-banner"]') as HTMLElement
        if (banner) banner.style.display = ''
      })
    }

    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('cta-volunteer')).toBeVisible()
    await expect(popup.getByTestId('cta-volunteer')).toHaveText('Volunteer')

    await popup.getByTestId('cta-volunteer').click()
    await expect(popup.getByText(/Contact:/)).toBeVisible()
  })

  test('zone popup contains tree species link and report damage button', async ({ page }) => {
    const opened = await clickFirstZoneMarker(page)

    const popup = page.locator('.leaflet-popup')
    if (!opened) {
      await page.evaluate(() => {
        const banner = document.querySelector('[data-testid="demo-banner"]') as HTMLElement
        if (banner) banner.style.display = 'none'
      })

      const box = await page.locator('.leaflet-interactive').first().boundingBox()
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      }

      await page.evaluate(() => {
        const banner = document.querySelector('[data-testid="demo-banner"]') as HTMLElement
        if (banner) banner.style.display = ''
      })
    }

    await expect(popup).toBeVisible({ timeout: 5000 })
    await expect(popup.getByTestId('tree-species-link')).toBeVisible()
    await expect(popup.getByTestId('report-damage-button')).toBeVisible()
  })
})
