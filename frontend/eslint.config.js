import js from '@eslint/js'
import betterTailwind from 'eslint-plugin-better-tailwindcss'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'better-tailwindcss': betterTailwind,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
    },
    rules: {
      'better-tailwindcss/no-deprecated-classes': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.config.ts', '**/*.config.js', '**/*.config.mjs', '**/*.cjs'],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaVersion: 2020,
      },
    },
  },
  {
    ignores: [
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      'public/**/*',
      'playwright-report',
      'coverage',
    ],
  },
)