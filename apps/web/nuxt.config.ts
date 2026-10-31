export default defineNuxtConfig({
  compatibilityDate: '2026-10-28',
  css: ['~/assets/css/eternalia.css'],
  runtimeConfig: {
    apiInternalUrl: process.env.NUXT_API_INTERNAL_URL ?? 'http://127.0.0.1:3001',
  },
});
