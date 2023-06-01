// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  ssr: true,
  typescript: {
    shim: false
  },
  runtimeConfig: {
    public: {
      mlServiceUrl: process.env.ML_SERVICE_URL,
      nhostRegion: process.env.NHOST_REGION,
      nhostSubdomain: process.env.NHOST_SUBDOMAIN
    }
  },
  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt', '@pinia/nuxt'],
  components: {
    global: true,
    dirs: ['~/components']
  },
  build: {
    transpile: ['ts-invariant/process', '@headlessui/vue']
  },
  css: ['@/assets/css/tailwind.scss', '@/assets/css/fonts.css'],
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          href: '/favicon.ico'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png'
        }
      ]
    }
  }
});
