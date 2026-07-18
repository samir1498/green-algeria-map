import { test, expect } from '@playwright/test'
import { createPngBuffer } from '../helpers/upload'

const PHOTO_ZONE_NAME = `Prod Upload Test ${Date.now()}`

test('uploads a photo after creating a zone on production', async ({ page }) => {
  await page.goto('/zones/new', { timeout: 60_000 })
  await expect(page.getByTestId('create-zone-form')).toBeVisible({ timeout: 30_000 })

  await page.getByTestId('field-name').fill(PHOTO_ZONE_NAME)
  await page.getByTestId('field-description').fill('Testing photo upload on production')
  await page.getByTestId('field-contact').fill('prod-test@greenalgeria.test')

  const mapPicker = page.getByTestId('map-picker')
  await mapPicker.scrollIntoViewIfNeeded()
  await mapPicker.waitFor({ state: 'visible', timeout: 15_000 })
  await mapPicker.click()
  await expect(page.getByText('Selected:')).toBeVisible({ timeout: 5_000 })

  await page.getByTestId('submit-zone').click()
  await expect(page.getByText('Zone created successfully')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('done-photos')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('upload-dropzone')).toBeVisible()

  await page.addStyleTag({ content: '[data-testid="file-input"] { opacity: 1 !important; }' })
  await page.getByTestId('file-input').setInputFiles({
    name: 'prod-test.png',
    mimeType: 'image/png',
    buffer: createPngBuffer(),
  })

  await expect(page.getByTestId('preview-image')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('uploading-spinner')).not.toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Photo successfully uploaded')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('preview-image')).not.toBeVisible({ timeout: 10_000 })
})
