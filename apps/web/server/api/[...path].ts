/**
 * Server-side API proxy. Host is taken only from private runtimeConfig.
 * This avoids a browser-facing backend origin and works for SSR and dev.
 * Nest remains authoritative for public visibility and future author auth.
 */
export default defineEventHandler(async (event) => {
  const { pathname, search } = getRequestURL(event);
  if (!pathname.startsWith('/api/')) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' });
  }
  const base = String(useRuntimeConfig(event).apiInternalUrl).replace(/\/+$/, '');
  return proxyRequest(event, base + pathname + search);
});
