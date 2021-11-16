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
  globals: {
    sourceViewer: false,
    licenseViewer: false,
    toast: false
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', { 'allowTemplateLiterals': true }],
    semi: ['error', 'always']
  }
}
