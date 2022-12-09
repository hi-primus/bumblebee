/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      primary: {
        darkest: '#00588f',
        darker: '#006bad',
        dark: '#007bc7',
        DEFAULT: '#309ee3',
        light: '#66b8ea',
        lighter: '#8ecef5',
        lightest: '#b6e1fc',
        highlight: '#e3f3fd',
      },
      error: {
        darkest: '#771818',
        darker: '#cb2a2a',
        dark: '#d53434',
        DEFAULT: '#f15555',
        light: '#f46767',
        lighter: '#f67979',
        lightest: '#f98b8b'
      },
      warn: {
        darkest: '#e1a219',
        darker: '#e4b321',
        dark: '#e3c026',
        DEFAULT: '#e3ce31',
        light: '#ebe070',
        lighter: '#ede882',
        lightest: '#f0ee99'
      },
      text: {
        darkest: '#030507',
        darkest: '#101419',
        darkest: '#1d2025',
        DEFAULT: '#24282e',
        light: '#666a70',
        lighter: '#838891',
        lightest: '#a2a7ae',
        alpha: '#01040ada',
      },
      line: {
        DEFAULT: '#e5e5e5',
        light: '#f5f5f5'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        mono: ['Ubuntu Mono', 'monospace'],
        'mono-table': ['Ubuntu Mono Table', 'Ubuntu Mono', 'monospace']
      }
    }
  },
  plugins: []
};
