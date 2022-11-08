// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  ssr: true,
  typescript: {
    shim: false
  },
  bridge: {
    nitro: false
  },
  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt', '@pinia/nuxt'],
  components: {
    global: true,
    dirs: ['~/components']
  },
  build: {
    transpile: ['ts-invariant/process', '@headlessui/vue']
  },
  css: ['@/assets/css/tailwind.css', '@/assets/css/fonts.css']
});
