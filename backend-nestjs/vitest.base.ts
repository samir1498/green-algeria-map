import { defineConfig } from 'vitest/config';

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
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
