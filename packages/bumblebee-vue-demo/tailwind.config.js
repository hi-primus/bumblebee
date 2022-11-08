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
        900: '#205a98',
        dark: '#277abb',
        800: '#277abb',
        700: '#2b8bcf',
        DEFAULT: '#309ee3',
        600: '#309ee3',
        500: '#34acf2',
        400: '#42b9f4',
        300: '#5dc6f6',
        light: '#88d6fa',
        200: '#88d6fa',
        100: '#b6e6fc',
        50: '#e2f5fe'
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
