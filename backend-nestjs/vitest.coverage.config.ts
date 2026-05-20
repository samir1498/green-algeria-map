import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    include: ['src/**/*.unit.spec.ts', 'test/**/*.it.spec.ts'],
    testTimeout: 120000,
    hookTimeout: 120000,
    pool: 'forks',
    fileParallelism: false,
    onUnhandledError(error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('57P01') ||
          error.message.includes(
            'terminating connection due to administrator command',
          ))
      ) {
        return false;
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
      exclude: [
        '**/*.entity.ts',
        '**/*.module.ts',
        '**/*.controller.ts',
        '**/main.ts',
        '**/data-source.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
});
