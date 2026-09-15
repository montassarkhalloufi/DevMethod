import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default defineConfig(
  {
    ignores: [
      'dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/.next/**',
      '**/next-env.d.ts',
      'evaluation/**',
      'scripts/media/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'scripts/**/*.mjs', 'tests/**/*.mjs', '*.config.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
    plugins: { sonarjs },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['examples/{pocket-tasks,clair-from-zero,fullstack}/**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
    plugins: { sonarjs },
    rules: { 'sonarjs/cognitive-complexity': ['error', 15] },
  },
  {
    files: [
      'examples/pocket-tasks/server.mjs',
      'examples/pocket-tasks/src/**/*.mjs',
      'examples/pocket-tasks/tests/**/*.mjs',
      'examples/clair-from-zero/tests/**/*.mjs',
      'examples/fullstack/api/**/*.ts',
      'examples/fullstack/tests/**/*.cjs',
      'examples/fullstack/web/*.config.mjs',
      'examples/fullstack/web/features/**/server/**/*.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: [
      'examples/pocket-tasks/public/**/*.js',
      'examples/clair-from-zero/app/**/*.mjs',
      'examples/fullstack/web/**/*.{ts,tsx}',
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    // These Node harnesses also contain callbacks executed inside a browser.
    files: ['examples/clair-from-zero/browser-check.cjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['examples/fullstack/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
);
