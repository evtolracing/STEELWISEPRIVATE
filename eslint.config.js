// ESLint flat config for the whole repo (backend, frontend, Vercel api/).
// Rules start lenient (warnings) so existing code passes; tighten them as
// modules are finished in later phases.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'archive-design-files/**',
      'DESIGN FILES/**',
      'supabase/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/backend/**/*.{js,mjs}', 'api/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    // QA tools and simulations run in Node. The browser suites also pass functions into a page.
    files: ['qa/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
  {
    files: ['qa/**/*.cjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['src/frontend/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-key': 'warn',
    },
  },
  {
    files: ['src/frontend/vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-catch': 'warn',
    },
  },
];
