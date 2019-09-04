const colors = require('vuetify/es5/util/colors').default

module.exports = {
	mode: 'universal',

	env: {
		WS_BROKER: process.env.WS_BROKER || '165.22.149.93',
    WS_PORT: process.env.WS_PORT || 15675
  },

  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '127.0.0.1'
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
			// { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Material+Icons|Ubuntu+Mono|Roboto+Mono' }
			{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Material+Icons|Ubuntu+Mono|Ubuntu' }
		],
		script: [
			{ src: 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js' }
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
		// Doc: https://github.com/nuxt-community/eslint-module
		// '@nuxtjs/eslint-module',
		'@nuxtjs/vuetify',
		'@nuxtjs/style-resources'
	],

	plugins: [
		{ src: '@/plugins/handsontable', mode: 'client' },
    '@/plugins/components.js',
		'@/plugins/numeral',
		'@/plugins/fuse',
		'@/plugins/varCheck'
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
					// primary: '#121212',
					// accent: colors.grey.darken3,
					// secondary: colors.amber.darken3,
					info: '#81caf9',
					warning: colors.amber,
					error: '#e57373',
					success: '#4db6ac'
				}
			}
    },
    icons: {
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
      iconfont: 'fa',
    },
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
