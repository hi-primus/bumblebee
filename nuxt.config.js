require('dotenv').config()
const colors = require('vuetify/es5/util/colors').default

module.exports = {
	mode: 'universal',

	server: {
		port: process.env.PORT || 3000,
		host: process.env.HOST || '127.0.0.1'
	},

	head: {
		titleTemplate: '%s - Bumblebee',
		title: 'Bumblebee',
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
			// { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Material+Icons|Ubuntu+Mono|Roboto+Mono' }
			{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Material+Icons|Ubuntu+Mono|Ubuntu' }
		]
	},

	loading: {
		color: '#3B8070'
	},

	css: [
		'@/assets/css/main.scss',
		'@fortawesome/fontawesome-free/css/all.css'
	],

	styleResources: {
		scss: [
			// '~assets/css/import/_index.scss'
		]
	},

	buildModules: [
		// '@nuxtjs/eslint-module',
		['@nuxtjs/google-tag-manager', { id: 'GTM-K8DTWMW' }],
		'@nuxtjs/dotenv',
		'@nuxtjs/vuetify',
		'@nuxtjs/style-resources'
	],

	plugins: [
		{ src: '@/plugins/handsontable.js', mode: 'client' },
		'@/plugins/components.js',
		'@/plugins/numeral.js',
		'@/plugins/fuse.js',
		'@/plugins/varCheck.js'
	],

	axios: {
		// See https://github.com/nuxt-community/axios-module#options
	},

	vuetify: {
		materialIcons: false,
		// customVariables: ['~/assets/variables.scss'],
		theme: {
			themes: {
				light: {
					primary: '#1972d1',
					// accent: colors.grey.darken3,
					// secondary: colors.amber.darken3,
					info: '#82bcfa',
					warning: colors.amber,
					error: '#e57373',
					success: '#4db6ac'
				}
			}
		},
		icons: {
			values: {
				'check-box-invert': {
					component: 'CheckBoxInvert',
					props: {
						name: 'check-box-invert'
					}
				}
			},
			iconfont: 'fa'
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
