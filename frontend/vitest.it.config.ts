import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.it.spec.{ts,tsx}', 'test/**/*.it.spec.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/shared/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage/it',
        thresholds: {
          lines: 60,
          branches: 50,
          functions: 60,
          statements: 60,
        },
        exclude: [
          'src/shared/components/ui/**',
          'src/routeTree.gen.ts',
          'src/routes/__root.tsx',
          'src/routes/auth/**',
          'src/main.tsx',
          '**/node_modules/**',
          '**/dist/**',
        ],
      },
    },
  }),
)
