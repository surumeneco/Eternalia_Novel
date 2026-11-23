/** Direct admin URLs require a current server-authorized author session.
 * A hidden menu is not an access-control boundary.
 */
export default defineNuxtRouteMiddleware(async to => {
  if (!to.path.startsWith('/admin')) return;
  try {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch;
    const session = await fetcher<{ authenticated: boolean }>('/api/auth/me');
    if (session?.authenticated === true) return;
  } catch { /* Treat missing/expired sessions as unauthenticated. */ }
  return navigateTo('/login', { replace: true });
});
