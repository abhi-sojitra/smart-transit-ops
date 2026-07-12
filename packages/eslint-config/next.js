/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**'],
  },
  {
    rules: {
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
    },
  },
];
