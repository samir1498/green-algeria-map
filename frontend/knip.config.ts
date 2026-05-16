export default {
  entry: ['src/styles.css', 'src/routes/**/*.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx,css}'],
  ignoreExportsUsedInFile: true,
  ignoreBinaries: ['dot'],
  ignoreDependencies: [
    '@tailwindcss/typography',
    '@tanstack/router-plugin',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'lint-staged',
    '@testing-library/dom',
    '@testing-library/react',
  ],
}
