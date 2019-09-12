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
    'indent': [
			'error',
			'tab'
    ],
    'quotes': [
			'error',
			'single'
		],
    'no-tabs': 0,
    'nuxt/no-cjs-in-config': 0,
    'vue/require-valid-default-prop': 0,
    'prefer-const': 0,
    'semi': [
			'error',
			'never'
		]
  }
}
