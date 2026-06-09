import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

export const COVERAGE_EXCLUDES = [
  '**/*.entity.ts',
  '**/*.module.ts',
  '**/*.controller.ts',
  '**/*.repository.ts',
  '**/*.mapper.ts',
  '**/main.ts',
  '**/data-source.ts',
  '**/node_modules/**',
  '**/dist/**',
];

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
  test: {
    root: projectRoot,
    globals: true,
    passWithNoTests: true,
  },
});
