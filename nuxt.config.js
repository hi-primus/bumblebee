const colors = require('vuetify/es5/util/colors').default

module.exports = {
	mode: 'universal',

	env: {
		WS_BROKER: process.env.WS_BROKER || '165.22.149.93',
		WS_PORT: process.env.WS_PORT || 15675
	},

	head: {
		titleTemplate: '%s - ' + process.env.npm_package_name,
		title: process.env.npm_package_name || '',
		meta: [{
			charset: 'utf-8'
		},
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1'
		},
		{
			hid: 'description',
			name: 'description',
			content: process.env.npm_package_description || ''
		}
		],
		link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico'
      },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Material+Icons' },
    ],
    script: [
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js' },
    ]
	},

	loading: {
		color: '#3B8070'
	},

	css: [
		'@/assets/css/main.scss'
	],

	styleResources: {
		scss: [
			'assets/css/import/_index.scss'
		]
	},

	devModules: [
		// Doc: https://github.com/nuxt-community/eslint-module
		// '@nuxtjs/eslint-module',
		'@nuxtjs/vuetify',
		'@nuxtjs/style-resources'
	],

	plugins: [
		'@/plugins/vuetify',
		'@/plugins/numeral',
		'@/plugins/varCheck'
	],

	modules: [
		// Doc: https://github.com/nuxt-community/axios-module#usage
		'@nuxtjs/axios',
	],

	axios: {
		// See https://github.com/nuxt-community/axios-module#options
	},

	vuetify: {
		materialIcons: false,
		customVariables: ['~/assets/variables.scss'],
		theme: {
			themes: {
				light: {
					primary: '#121212',
					accent: colors.grey.darken3,
					secondary: colors.amber.darken3,
					info: colors.teal.lighten1,
					warning: colors.amber,
					error: colors.deepOrange.accent4,
					success: colors.green.accent3
				}
			}
		}
	},

	build: {
		extend (config, {
			isDev
		}) {
			if (isDev && process.client) {
				config.module.rules.push({
					enforce: 'pre',
					test: /\.(js|vue)$/,
					loader: 'eslint-loader',
					exclude: /(node_modules)/
				})
			}
		}
	}
}
