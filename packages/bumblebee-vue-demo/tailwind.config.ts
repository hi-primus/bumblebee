import type { Config } from 'tailwindcss';

export default {
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
      black: '#000000',
      primary: {
        darkest: '#00588f',
        darker: '#006bad',
        dark: '#007bc7',
        DEFAULT: '#309ee3',
        light: '#66b8ea',
        lighter: '#8ecef5',
        lightest: '#b6e1fc',
        highlight: '#e3f3fd'
      },
      success: {
        darkest: '#1f6945',
        darker: '#25925d',
        dark: '#2aba74',
        DEFAULT: '#30e38c',
        light: '#5deba6',
        lighter: '#89f4c0',
        lightest: '#b6fcda',
        highlight: '#e3fdf0'
      },
      error: {
        darkest: '#771818',
        darker: '#cb2a2a',
        dark: '#d53434',
        DEFAULT: '#f15555',
        light: '#f46767',
        lighter: '#f67979',
        lightest: '#f98b8b',
        highlight: '#f9b9b9'
      },
      warn: {
        darkest: '#e1a219',
        darker: '#e4b321',
        dark: '#e3c026',
        DEFAULT: '#e3ce31',
        light: '#ebe070',
        lighter: '#ede882',
        lightest: '#f0ee99',
        highlight: '#f4f3c3'
      },
      text: {
        darkest: '#030507',
        darker: '#101419',
        dark: '#1d2025',
        DEFAULT: '#24282e',
        light: '#45494f',
        lighter: '#838891',
        lightest: '#a2a7ae',
        alpha: '#01040ada'
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
} as Config;
