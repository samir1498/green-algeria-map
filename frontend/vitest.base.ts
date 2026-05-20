import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    passWithNoTests: false,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
