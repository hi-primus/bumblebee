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
        darkest: '#005390',
        darker: '#006bab',
        dark: '#0084c7',
        DEFAULT: '#309ee3',
        light: '#66c0ea', // 300
        lighter: '#b6e6fc', // 100
      },
      error: {
        dark: '#d53134',
        DEFAULT: '#f15555',
        light: '#f99290'
      },
      warn: {
        dark: '#e0a019',
        DEFAULT: '#e3ce30',
        light: '#f0ef9a'
      },
      text: {
        DEFAULT: '#24282e',
        alpha: '#01040ada',
        light: '#656970',
        lighter: '#a3a7af'
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
