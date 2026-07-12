/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  {
    rules: {
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
    },
  },
];
