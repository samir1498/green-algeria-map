import { test, expect } from '@playwright/test'

const ZONE_NAME = `E2E Test Zone ${Date.now()}`

test.describe('Desktop create zone form', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

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
    await expect(page.getByPlaceholder('Email or phone number')).toBeVisible()
    await expect(page.getByPlaceholder('Cedrus atlantica')).toBeVisible()
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
    await page.getByTestId('field-description').fill('Test description')
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Name is required')).toBeVisible()
  })

  test('shows validation error when description is empty', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('field-name').fill('Test Zone')
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Description is required')).toBeVisible()
  })

  test('successfully submits a new zone with all fields', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByTestId('field-name').fill(ZONE_NAME)
    await page.getByTestId('field-description').fill('Created during e2e test')
    await page.getByPlaceholder('Email or phone number').fill('test@example.com')
    await page.getByPlaceholder('Cedrus atlantica').fill('Pinus halepensis')
    await page.getByTestId('map-picker').click()
    await page.waitForTimeout(500)
    await page.getByTestId('submit-zone').click()
    await expect(page.getByText('Zone created successfully')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL('/')
  })

  test('cancel button returns to home page', async ({ page }) => {
    await page.goto('/zones/new')
    await page.getByRole('button', { name: 'Cancel' }).click()
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
