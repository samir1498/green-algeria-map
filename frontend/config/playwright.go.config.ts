import { defineConfig } from '@playwright/test'

const STORAGE_STATE = 'playwright/.auth/user.json'

export default defineConfig({
  testDir: '../e2e',
  testIgnore: ['**/prod/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
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
      name: 'desktop',
      dependencies: ['setup'],
      use: {
        viewport: { width: 1280, height: 720 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: 'mobile',
      dependencies: ['setup'],
      use: {
        viewport: { width: 390, height: 844 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: 'real-api',
      dependencies: ['setup'],
      use: {
        viewport: { width: 1280, height: 720 },
        storageState: STORAGE_STATE,
      },
    },
  ],

  webServer: [
    {
      command: 'scripts/e2e-start.sh',
      url: 'http://localhost:8082/healthz',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: '../../backend-go',
      env: {
        ...process.env,
        DISABLE_RATE_LIMIT: 'true',
      },
    },
    {
      command: 'pnpm preview --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ],
})
