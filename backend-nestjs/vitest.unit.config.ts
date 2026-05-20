import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.unit.spec.ts'],
      environment: 'node',
    },
  }),
);
