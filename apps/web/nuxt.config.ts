export default defineNuxtConfig({
  compatibilityDate: '2026-10-28',
  css: ['~/assets/css/eternalia.css'],
  routeRules: {
    '/api/**': { proxy: `${process.env.NUXT_API_INTERNAL_URL ?? 'http://localhost:3001'}/api/**` },
  },
});
