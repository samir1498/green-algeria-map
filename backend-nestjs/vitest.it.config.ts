import { mergeConfig } from 'vitest/config';
import baseConfig from './vitest.base';

export default mergeConfig(baseConfig, {
  test: {
    include: ['test/**/*.it.spec.ts'],
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
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
  },
});
