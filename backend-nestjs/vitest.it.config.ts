import { mergeConfig } from 'vitest/config'
import baseConfig from './vitest.base'

export default mergeConfig(baseConfig, {
  test: {
    include: ['test/**/*.it.spec.ts'],
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    dangerouslyIgnoreUnhandledErrors: true,
  },
})