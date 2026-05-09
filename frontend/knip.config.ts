export default {
  entry: [
    'src/main.tsx',
    'src/styles.css',
    'vite.config.ts',
    'src/routes/**/*.{ts,tsx}',
    'src/components/ui/**/*.{ts,tsx}',
  ],
  project: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.css'],
  ignoreExportsUsedInFile: true,
  ignore: [
    'vite.config.ts',
    'eslint.config.js',
    'src/vite-env.d.ts',
    'src/router.tsx',
    '**/*.d.ts',
    'node_modules/**/*',
    'dist/**/*',
    'build/**/*',
    'public/**/*',
    'src/components/map/**/*',
  ],
  packageRules: [
    {
      include: ['leaflet', 'react-leaflet', '@types/leaflet', '@testing-library/dom', '@testing-library/react', 'jsdom', 'vitest'],
      ignore: true,
    },
  ],
}