require('dotenv-defaults').config()
require('dotenv').config()
const colors = require('vuetify/es5/util/colors').default

module.exports = {
	server: {
		port: process.env.PORT,
		host: process.env.HOST
	},

	head: {
		titleTemplate: '%s',
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
				type: 'image/png',
				href: '/favicon.png'
			},
			{ rel: 'stylesheet', href: '/highlight/styles/default.css' }
    ],
    script: [
      { src: '/highlight/highlight.pack.js' }
    ],
	},

	loading: false,

	css: [
		'@/assets/css/main.scss',
		'@/assets/css/fonts.css',
		'@mdi/font/css/materialdesignicons.min.css'
	],

	styleResources: {
		scss: [
			// '~assets/css/import/_index.scss'
		]
  },

  modules: [
		'@nuxtjs/axios',
		'nuxt-material-design-icons',
  ],

	buildModules: [
    // '@nuxtjs/eslint-module',
    'cookie-universal-nuxt',
		['@nuxtjs/google-tag-manager', { id: 'GTM-K8DTWMW' }],
		'@nuxtjs/dotenv',
		'@nuxtjs/vuetify',
    '@nuxtjs/style-resources'
	],

	plugins: [
		{ src: '@/plugins/konva.js', mode: 'client' },
		{ src: '@/plugins/persistedstate.js' },
		'@/plugins/draggable.js',
		'@/plugins/components.js',
		'@/plugins/filters.js',
		'@/plugins/numeral.js',
		'@/plugins/fuse.js',
		'@/plugins/varCheck.js'
  ],

	axios: {
    progress: false,
    baseUrl: process.env.API_URL
		// proxyHeaders: false
	},

	vuetify: {
		materialIcons: false,
    customVariables: ['~/assets/css/vuetify-variables.scss'],
    treeShake: true,
    options: {
      customProperties: true
    },
		theme: {
			themes: {
				light: {
					primary: '#309ee3',
					info: '#82bcfa',
					warning: colors.amber,
					error: '#F15555',
					success: '#4db6ac',
					dataprimary: '#309ee3'
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
		extend (config, { isDev }) {
      config.resolve.alias['vue'] = 'vue/dist/vue.common'
      config.resolve.symlinks = false
			if (isDev && process.client) {
				config.module.rules.push({
					enforce: 'pre',
					test: /\.(js|vue)$/,
					loader: 'eslint-loader',
					exclude: /(node_modules)/
				})
			}
		}
  },

  telemetry: false

}
