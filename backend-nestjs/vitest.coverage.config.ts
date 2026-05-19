import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    include: ['src/**/*.unit.spec.ts', 'test/**/*.it.spec.ts'],
    testTimeout: 120000,
    hookTimeout: 120000,
    pool: 'forks',
  },
})