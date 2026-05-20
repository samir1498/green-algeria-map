import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: [
        'src/**/*.unit.spec.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.test.ts',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage/unit',
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
