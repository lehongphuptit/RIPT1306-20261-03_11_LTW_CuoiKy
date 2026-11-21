import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'public/**'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      'no-undef': js.configs.recommended.rules['no-undef'],
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-redeclare': 'error',
      'valid-typeof': 'error',
    },
  },
];
