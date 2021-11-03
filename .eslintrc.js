/* eslint-disable */
module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', { 'allowTemplateLiterals': true }],
    semi: ['error', 'always']
  }
}
