/** Direct admin URLs require a current server-authorized author session.
 * A hidden menu is not an access-control boundary.
 */
export default defineNuxtRouteMiddleware(async to => {
  if (!to.path.startsWith('/admin')) return;
  try {
    const endpoint: string = '/api/auth/me';
    const session = await $fetch<{ authenticated: boolean }>(endpoint, {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    });
    if (session?.authenticated === true) return;
  } catch { /* Treat missing/expired sessions as unauthenticated. */ }
  return navigateTo('/login', { replace: true });
});
