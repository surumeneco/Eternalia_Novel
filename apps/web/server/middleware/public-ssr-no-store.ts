/**
 * SSR pages can embed live published content or author-only UI.
 * On subsequent reads those pages must not be served from an HTTP cache after
 * a publication/visibility change. Keep versioned assets and the existing API
 * proxy outside this middleware's route set.
 */
const htmlRouteRoots = [
  '/stories', '/tips', '/dictionaries', '/timeline', '/series',
  '/read', '/items', '/search', '/studio',
] as const;

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return;
  const pathname = getRequestURL(event).pathname;
  const isHtmlRoute = pathname === '/' || htmlRouteRoots.some(
    root => pathname === root || pathname.startsWith(root + '/'),
  );
  if (!isHtmlRoute) return;
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
});
