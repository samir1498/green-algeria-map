export default {
  entry: ['src/styles.css', 'src/routes/**/*.{ts,tsx}', 'src/features/*/api/**/*.ts'],
  project: ['src/**/*.{ts,tsx,css}'],
  ignore: ['config/vitest*.config.ts'],
  ignoreExportsUsedInFile: true,
  ignoreBinaries: ['dot'],
  ignoreDependencies: [
    '@tailwindcss/typography',
    '@tanstack/router-plugin',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'lint-staged',
  ],
}
