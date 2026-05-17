import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

import pluginImport from 'eslint-plugin-import-x';

export default [
  {
    ignores: [
      '.vscode/',
      '.yarn/',
      'dist/',
      'public/',
      'docs/',
      'pnpm-lock.yml',
      'src/**/*.generated.*',
      'eslint.config.js',
    ],
  },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'import-x': pluginImport,
    },
    settings: {
      // This will do the trick
      'import-x/parsers': {
        espree: ['.js', '.cjs', '.mjs', '.jsx'],
      },
      'import-x/resolver': {
        node: true,
        alias: {
          map: [
            ['@', './src'],
            ['~', './node_modules'],
          ],
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      camelcase: 'off',
      'no-unused-vars': 'warn',
      // Sort Import Order.
      // see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md#importorder-enforce-a-convention-in-module-import-order
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            // Vue Core
            {
              pattern:
                '{vue,vue-router,vuex,@/stores,vue-i18n,pinia,vite,vitest,vitest/**,@vitejs/**,@vue/**}',
              group: 'external',
              position: 'before',
            },
            // Internal Codes
            {
              pattern: '{@/**}',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
          },
          'newlines-between': 'always',
        },
      ],
    },
  },
  // ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
];
