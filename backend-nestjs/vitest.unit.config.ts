import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.unit.spec.ts'],
      environment: 'node',
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
  }),
);
