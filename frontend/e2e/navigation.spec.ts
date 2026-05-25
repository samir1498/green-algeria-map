import { test, expect } from '@playwright/test'

test.describe('Desktop navigation', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('user navigates to about page via nav link', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-about').click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByText(/Green Algeria Map is a platform/)).toBeVisible()
  })

  test('sign in button leads to login form', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-map').waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
  })
})

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hamburger menu opens and closes nav', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('open-menu-button').click()
    await expect(page.getByTestId('mobile-nav-map')).toBeVisible()
    await expect(page.getByTestId('mobile-nav-about')).toBeVisible()

    await page.getByTestId('close-menu-button').click()
    await expect(page.getByTestId('mobile-nav-map')).toBeHidden()
  })

  test('user navigates via hamburger menu', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('open-menu-button').click()
    await page.getByTestId('mobile-nav-about').click()
    await expect(page).toHaveURL('/about')
  })
})
