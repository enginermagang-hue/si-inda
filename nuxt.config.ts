// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'SIINDAH — Layanan Dapodik',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Microsite informasi dan pelayanan pendataan Dapodik.',
        },
      ],
      link: [],
    },
  },

  runtimeConfig: {
    // Server-only (baca dari env NUXT_JWT_SECRET, dst.)
    jwtSecret: '',
    tursoUrl: '',
    tursoAuthToken: '',
    storageDriver: 'local',
    dropboxAppKey: '',
    dropboxAppSecret: '',
    dropboxRefreshToken: '',
    dropboxFolder: '/siindah/surat',
    adminName: 'Administrator',
    adminUsername: 'admin',
    adminPassword: 'admin123',
    public: {
      siteUrl: '',
    },
  },
})
