import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    include: ['src/**/*.unit.spec.{ts,tsx}'],
    environment: 'node',
    setupFiles: [],
    passWithNoTests: false,
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
        'src/shared/components/ui/**',
        'src/routeTree.gen.ts',
        'src/routes/__root.tsx',
        'src/main.tsx',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
})
