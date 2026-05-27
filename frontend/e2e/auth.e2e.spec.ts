import crypto from 'node:crypto'
import { test, expect } from '@playwright/test'

const AUTH_BASE = 'http://localhost:8080/api/auth'
const TEST_PASSWORD = 'TestPassword123!'

function uniqueEmail(): string {
  return `e2e-${crypto.randomUUID().slice(0, 8)}@test.greenalgeria.local`
}

async function apiSignUp(page: any, name: string, email: string): Promise<void> {
  const res = await page.request.post(`${AUTH_BASE}/sign-up/email`, {
    data: { name, email, password: TEST_PASSWORD },
  })
  expect(res.status()).toBe(200)
}

async function apiSignOut(page: any): Promise<void> {
  await page.request.post(`${AUTH_BASE}/sign-out`)
  await page.context().clearCookies()
}

async function uiRegister(page: any, name: string, email: string): Promise<void> {
  await page.getByTestId('name-input').fill(name)
  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('password-input').fill(TEST_PASSWORD)
  await page.getByTestId('submit-button').click()
}

async function uiLogin(page: any, email: string): Promise<void> {
  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('password-input').fill(TEST_PASSWORD)
  await page.getByTestId('submit-button').click()
}

test.describe('Auth flows', () => {
  test('register via UI and access protected dashboard', async ({ page }) => {
    const email = uniqueEmail()
    const name = 'E2E Test User'

    await page.goto('/auth/register')
    await expect(page.getByTestId('register-form')).toBeVisible()

    await uiRegister(page, name, email)
    await page.waitForURL('/')

    await page.goto('/dashboard')
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
    await expect(page.getByTestId('dashboard-welcome')).toHaveText(`Welcome, ${name}`)
    await expect(page.getByTestId('dashboard-email')).toHaveText(email)
    await expect(page.getByTestId('dashboard-role')).toHaveText('volunteer')
  })

  test('login preserves redirect target', async ({ page }) => {
    const email = uniqueEmail()

    await apiSignUp(page, 'Redirect Test', email)
    await apiSignOut(page)

    await page.goto('/dashboard')
    await page.waitForURL(/\/auth\/login\?redirect=.+dashboard/)
    await expect(page.getByTestId('login-form')).toBeVisible()

    await uiLogin(page, email)

    await page.waitForURL('/dashboard')
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
  })

  test('guest-only guard redirects authenticated users away from login', async ({ page }) => {
    const email = uniqueEmail()

    await apiSignUp(page, 'Guest Guard', email)
    await page.goto('/auth/login')
    await page.waitForURL('/')
  })

  test('session persists across page reload', async ({ page }) => {
    const email = uniqueEmail()

    await apiSignUp(page, 'Session Test', email)

    await page.goto('/dashboard')
    await expect(page.getByTestId('dashboard-page')).toBeVisible()

    await page.reload()
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
    await expect(page.getByTestId('dashboard-welcome')).toContainText('Session Test')
  })

  test('register with redirect param sends user to target', async ({ page }) => {
    const email = uniqueEmail()

    await page.goto('/auth/register?redirect=%2Fdashboard')
    await expect(page.getByTestId('register-form')).toBeVisible()

    await uiRegister(page, 'Redirect Register', email)
    await page.waitForURL('/dashboard')
    await expect(page.getByTestId('dashboard-page')).toBeVisible()
  })
})
