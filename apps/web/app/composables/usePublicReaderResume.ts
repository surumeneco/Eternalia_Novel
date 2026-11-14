/**
 * Reader-side published-data lifecycle guard.
 *
 * The server decides effective publication. A mounted page must not keep
 * showing its old published projection after a hidden-tab/BFCache return.
 * All page-owned public resources are cleared before revalidation; a failed
 * fetch is never replaced with a previously rendered draft/published value.
 *
 * Deliberately not a push revocation protocol or a replacement for real
 * browser/OS lifecycle testing. Client-only listeners leave SSR unchanged.
 */
export function usePublicReaderResume(
  clearPublicData: () => void,
  refreshPublicData: () => Promise<unknown>,
) {
  const resuming = ref(false);
  let generation = 0;
  let refreshing = false;

  function invalidate() {
    generation += 1;
    resuming.value = true;
    clearPublicData();
  }

  async function revalidate() {
    if (!resuming.value || document.visibilityState !== 'visible' || refreshing) return;
    const startedAt = generation;
    refreshing = true;
    try {
      await refreshPublicData();
    } catch {
      // The owning useFetch/useAsyncData tracks errors. Old data has already
      // been cleared, so a failed refresh must not restore it implicitly.
    } finally {
      refreshing = false;
      if (document.visibilityState !== 'visible') return;
      if (startedAt === generation) resuming.value = false;
      else void revalidate();
    }
  }

  function handleVisibility() {
    if (document.visibilityState === 'hidden') invalidate();
    else void revalidate();
  }
  function handlePageHide() { invalidate(); }
  function handlePageShow(event: PageTransitionEvent) {
    if (!event.persisted) return;
    invalidate();
    void revalidate();
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
  });
  return { resuming };
}
