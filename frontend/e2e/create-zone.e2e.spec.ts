import { test, expect } from '@playwright/test'
import { uploadPhoto, createPngBuffer } from './helpers/upload'
import { setupTreeApiMocks } from './helpers/mock-tree-api'

const ZONE_NAME = `E2E Test Zone ${Date.now()}`

test.describe('Desktop create zone form', () => {
  test.use({ viewport: { width: 1280, height: 720 } })
  test.beforeEach(async ({ page }) => {
    await setupTreeApiMocks(page)
  })

  test('navigates to /zones/new via nav link', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-add-zone').click()
    await expect(page).toHaveURL('/zones/new')
    await expect(page.getByTestId('create-zone-form')).toBeVisible()
  })

  test('form renders all fields', async ({ page }) => {
    await page.goto('/zones/new')
    await expect(page.getByTestId('field-name')).toBeVisible()
    await expect(page.getByTestId('field-type')).toBeVisible()
    await expect(page.getByTestId('field-description')).toBeVisible()
    await expect(page.getByTestId('map-picker')).toBeVisible()
    await expect(page.getByTestId('submit-zone')).toBeVisible()
    await expect(page.getByTestId('field-contact')).toBeVisible()
    await expect(page.getByTestId('tree-search-input')).toBeVisible()
  })

  test('shows validation error when submitting without coordinates', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('field-name').fill('Test Zone')
    await page.getByTestId('field-description').fill('Test description')
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Click on the map to set the location')).toBeVisible()
  })

  test('shows validation error when name is empty', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('map-picker').click()
    await page.getByTestId('field-description').fill('Test description')
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Name is required')).toBeVisible()
  })

  test('shows validation error when description is empty', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('map-picker').click()
    await page.getByTestId('field-name').fill('Test Zone')
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Description is required')).toBeVisible()
  })

  test('successfully submits a new zone with all fields', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('field-name').fill(ZONE_NAME)
    await page.getByTestId('field-description').fill('Created during e2e test')
    await page.getByTestId('field-contact').fill('test@example.com')
    const treeInput = page.getByTestId('tree-search-input')
    await treeInput.fill('Pinus halepensis')
    const treeDropdown = page.getByTestId('tree-search-dropdown')
    await expect(treeDropdown).toBeVisible({ timeout: 20000 })
    await treeDropdown.locator('button').first().click()
    const mapPicker = page.getByTestId('map-picker')
    await mapPicker.scrollIntoViewIfNeeded()
    await mapPicker.waitFor({ state: 'visible', timeout: 15000 })
    await mapPicker.click()
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Zone created successfully')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('done-photos')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('done-photos').click()
    await expect(page).toHaveURL('/')
  })

  test('cancel button returns to home page', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Photo upload after zone creation', () => {
  test.use({ viewport: { width: 1280, height: 720 } })
  // Serial prevents CDP node ID contention from parallel workers.
  // The input is opacity-0 so we strip styles via evaluate before setInputFiles.
  // https://webcrawlerapi.com/glossary/playwright/how-to-fix-playwright-file-upload-setinputfiles
  test.describe.configure({ mode: 'serial', retries: 2 })

  const PHOTO_ZONE_NAME = `E2E Photo Test ${Date.now()}`

  test('uploads a photo after creating a zone', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('field-name').fill(PHOTO_ZONE_NAME)
    await page.getByTestId('field-description').fill('Testing photo upload')
    const mapPicker = page.getByTestId('map-picker')
    await mapPicker.scrollIntoViewIfNeeded()
    await mapPicker.waitFor({ state: 'visible', timeout: 15000 })
    await mapPicker.click()
    await expect(page.getByText('Selected:')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Zone created successfully')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('done-photos')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('upload-dropzone')).toBeVisible()

    await uploadPhoto(page, createPngBuffer())

    await expect(page.getByTestId('preview-image')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Photo successfully uploaded')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('uploading-spinner')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('preview-image')).not.toBeVisible({ timeout: 5000 })

    await page.getByTestId('done-photos').click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Mobile create zone navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('navigates to /zones/new via hamburger menu', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('open-menu-button').click()
    await page.getByTestId('mobile-nav-add-zone').click()
    await expect(page).toHaveURL('/zones/new')
    await expect(page.getByTestId('create-zone-form')).toBeVisible()
  })
})
