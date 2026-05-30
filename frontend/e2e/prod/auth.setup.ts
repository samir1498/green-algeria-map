import crypto from 'node:crypto'
import { test as setup, expect } from '@playwright/test'

const AUTH_BASE = 'https://green-algeria-map.onrender.com/api/auth'
const authFile = 'playwright/.auth/prod-user.json'

setup('authenticate on production', async ({ page }) => {
  const email = `prod-e2e-${crypto.randomUUID().slice(0, 8)}@test.greenalgeria.local`

  const res = await page.request.post(`${AUTH_BASE}/sign-up/email`, {
    data: { name: 'Prod E2E User', email, password: 'TestPassword123!' },
    timeout: 30_000,
  })
  expect(res.status()).toBe(200)

  await page.goto('/', { timeout: 30_000 })
  await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 30_000 })

  await page.context().storageState({ path: authFile })
})
