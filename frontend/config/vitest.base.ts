import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    conditions: ['node'],
  },
  plugins: [viteReact()],
  test: {
    root,
    passWithNoTests: false,
    environment: 'jsdom',
  },
})
