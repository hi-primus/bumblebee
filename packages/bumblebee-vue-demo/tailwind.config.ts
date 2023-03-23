import type { Config } from 'tailwindcss';

const colors = {
  blue: {
    darkest: '#00588f',
    darker: '#006bad',
    dark: '#007bc7',
    DEFAULT: '#309ee3',
    light: '#66b8ea',
    lighter: '#8ecef5',
    lightest: '#b6e1fc',
    highlight: '#e3f3fd'
  },
  green: {
    darkest: '#1f6945',
    darker: '#25925d',
    dark: '#2aba74',
    DEFAULT: '#30e38c',
    light: '#5deba6',
    lighter: '#89f4c0',
    lightest: '#b6fcda',
    highlight: '#d4f1e3'
  },
  red: {
    darkest: '#771818',
    darker: '#cb2a2a',
    dark: '#d53434',
    DEFAULT: '#f15555',
    light: '#f46767',
    lighter: '#f67979',
    lightest: '#f98b8b',
    highlight: '#f7d6d6',
    desaturated: '#e36363',
    'desaturated-dark': '#c34646'
  },
  yellow: {
    darkest: '#e1a219',
    darker: '#e4b321',
    dark: '#e3c026',
    DEFAULT: '#e3ce31',
    light: '#ebe070',
    lighter: '#ede882',
    lightest: '#f0ee99',
    highlight: '#f9f2d4'
  },
  gray: {
    darkest: '#24282e',
    darker: '#45494f',
    dark: '#838891',
    DEFAULT: '#a2a7ae',
    light: '#c4c6ca',
    lighter: '#e5e5e5',
    lightest: '#f5f5f5',
    highlight: '#f5f5f5'
  }
};

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './utils/**/*.ts',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      ...colors,
      primary: colors.blue,
      success: colors.green,
      error: colors.red,
      warn: colors.yellow,
      background: '#ffffff',
      neutral: {
        DEFAULT: colors.gray.darkest,
        light: colors.gray.darker,
        lighter: colors.gray.dark,
        lightest: colors.gray.DEFAULT,
        alpha: '#01040ada'
      },
      line: {
        dark: colors.gray.light,
        DEFAULT: colors.gray.lighter,
        light: colors.gray.lightest
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
