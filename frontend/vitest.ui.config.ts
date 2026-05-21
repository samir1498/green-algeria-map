import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.ui.spec.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage/ui',
        thresholds: {
          lines: 80,
          branches: 75,
          functions: 80,
          statements: 80,
        },
        exclude: [
          'src/components/ui/**',
          'src/routeTree.gen.ts',
          'src/routes/__root.tsx',
          'src/main.tsx',
          '**/node_modules/**',
          '**/dist/**',
        ],
      },
    },
  }),
)
