export default defineNuxtConfig({
  compatibilityDate: '2026-10-28',
  css: ['~/assets/css/eternalia.css'],
  app: { head: { link: [{ rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css' }] } },
  runtimeConfig: {
    apiInternalUrl: process.env.NUXT_API_INTERNAL_URL ?? 'http://127.0.0.1:3001',
  },
});
