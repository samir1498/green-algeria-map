import { defineConfig } from '@playwright/test'

const STORAGE_STATE = 'playwright/.auth/prod-user.json'

export default defineConfig({
  testDir: '../e2e/prod',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  timeout: 120_000,
  use: {
    baseURL: 'https://green-algeria-map.pages.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    browserName: 'chromium',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'smoke',
      dependencies: ['setup'],
      use: {
        viewport: { width: 1280, height: 720 },
        storageState: STORAGE_STATE,
      },
    },
  ],
})
