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
    'indent': [2, 'tab'],
    'no-tabs': 0,
    'nuxt/no-cjs-in-config': 0,
    'vue/require-valid-default-prop': 0
  }
}
