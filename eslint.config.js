import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
  { files: ['client/**/*.js'], languageOptions: { globals: globals.browser } },
  {
    files: ['shared/**/*.js'],
    ignores: ['shared/**/*.test.js'],
    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.keys(globals.node).map((name) => [name, 'off']),
        ),
      },
    },
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'performance',
        'Date',
      ],
      'no-restricted-properties': [
        {
          object: 'Math',
          property: 'random',
          message: 'Use a seeded PRNG stored in simulation state.',
        },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['phaser', 'phaser/*', 'node:*'] },
      ],
    },
  },
];
