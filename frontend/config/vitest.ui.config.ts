import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.ui.spec.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/shared/test/setup.ts'],
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
          'src/shared/components/ui/**',
          'src/shared/lib/**',
          'src/shared/utils/**',
          'src/shared/constants/**',
          'src/shared/types/**',
          'src/routeTree.gen.ts',
          'src/routes/__root.tsx',
          'src/routes/auth/**',
          'src/features/auth/api/**',
          'src/main.tsx',
          '**/node_modules/**',
          '**/dist/**',
        ],
      },
    },
  }),
)
