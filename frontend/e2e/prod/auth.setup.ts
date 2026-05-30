import { test as setup, expect } from '@playwright/test'

const AUTH_BASE = 'https://green-algeria-map.onrender.com/api/auth'
const authFile = 'playwright/.auth/prod-user.json'

const PROD_USER = {
  email: process.env.E2E_PROD_EMAIL ?? 'e2e-prod@greenalgeria.test',
  password: process.env.E2E_PROD_PASSWORD,
  name: process.env.E2E_PROD_NAME ?? 'E2E Prod Test User',
}

if (!PROD_USER.password) {
  throw new Error('E2E_PROD_PASSWORD must be set to run production auth setup')
}

setup('authenticate on production', async ({ page }) => {
  const signInRes = await page.request.post(`${AUTH_BASE}/sign-in/email`, {
    data: { email: PROD_USER.email, password: PROD_USER.password },
    timeout: 30_000,
  })

  if (!signInRes.ok()) {
    const signUpRes = await page.request.post(`${AUTH_BASE}/sign-up/email`, {
      data: { name: PROD_USER.name, email: PROD_USER.email, password: PROD_USER.password },
      timeout: 30_000,
    })
    expect(signUpRes.status()).toBe(200)
  }

  await page.goto('/', { timeout: 30_000 })
  await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 30_000 })

  await page.context().storageState({ path: authFile })
})
