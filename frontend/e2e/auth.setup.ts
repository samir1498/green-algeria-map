import crypto from 'node:crypto'
import { test as setup, expect } from '@playwright/test'

const AUTH_BASE = 'http://localhost:8080/api/auth'
const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const email = `e2e-setup-${crypto.randomUUID().slice(0, 8)}@test.greenalgeria.local`

  const res = await page.request.post(`${AUTH_BASE}/sign-up/email`, {
    data: { name: 'E2E Setup User', email, password: 'TestPassword123!' },
  })
  expect(res.status()).toBe(200)

  await page.goto('/')
  await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 30000 })

  await page.context().storageState({ path: authFile })
})
