import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export const COVERAGE_EXCLUDES = [
  '**/*.entity.ts',
  '**/*.module.ts',
  '**/*.controller.ts',
  '**/main.ts',
  '**/data-source.ts',
  '**/node_modules/**',
  '**/dist/**',
];

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
    },
  },
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
