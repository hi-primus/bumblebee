// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  build: {
    postcss: {}
  },
  css: ['@/assets/css/tailwind.css']
});
