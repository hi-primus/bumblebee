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
        light: '#66b8ea', // 300
        lighter: '#b6e1fc', // 100
        highlight: '#99cae9',
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
