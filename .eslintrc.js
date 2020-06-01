module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },

  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs',
    'plugin:nuxt/recommended'
  ],
  rules: {
    'indent': 2,
    'quotes': 'single',
    'no-tabs': 1,
    'nuxt/no-cjs-in-config': 0,
    'vue/require-valid-default-prop': 0,
    'prefer-const': 0,
    'semi': 'never',
    'no-extra-boolean-cast': 0,
    'no-var': 0,
    'space-before-function-paren': 1
  }
}
