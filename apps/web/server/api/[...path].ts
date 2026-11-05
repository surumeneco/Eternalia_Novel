/**
 * Server-side API proxy with a fixed private upstream.
 * Redirects are returned to the browser rather than followed by the SSR server
 * (required for Discord OAuth2).
 */
export default defineEventHandler(async (event) => {
  const { pathname, search } = getRequestURL(event);
  if (!pathname.startsWith('/api/')) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' });
  }
  const base = String(useRuntimeConfig(event).apiInternalUrl).replace(/\/+$/, '');
  return proxyRequest(event, base + pathname + search, {
    fetchOptions: { redirect: 'manual' },
  });
});
