import { defineConfig } from '@playwright/test'

const STORAGE_STATE = 'playwright/.auth/user.json'

export default defineConfig({
  testDir: '../e2e',
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
  ],

  webServer: [
    {
      command: 'scripts/e2e-start.sh',
      url: 'http://localhost:8080/api/health/live',
      reuseExistingServer: !process.env.CI,
      cwd: '../../backend-nestjs',
      timeout: 120_000,
    },
    {
      command: 'pnpm preview --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ],
})
