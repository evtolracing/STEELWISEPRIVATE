// Lint gate: catches what the production build does not, a name that is used and never defined.
// Kept narrow on purpose so it can fail the build without a backlog of style warnings.
//   npm run lint
import react from 'eslint-plugin-react'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    // Some files carry a disable comment for the hooks plugin, which is not installed. This stub
    // keeps those comments valid without adding the plugin.
    plugins: { react, 'react-hooks': { rules: { 'exhaustive-deps': { create: () => ({}) } } } },
    rules: {
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
      'no-import-assign': 'error',
    },
  },
]
