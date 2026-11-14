/** Invalidate public reader snapshots after a hidden/BFCache lifecycle.
 * This guards an already-mounted reader view; the server remains the sole
 * authority for effective publication (self + every ancestor).
 * It is NOT a live subscription to author publication changes.
 */
type PublicReaderSource = {
  clear: () => void;
  refresh: () => Promise<unknown>;
};

export function usePublicReaderRevalidation(sources: PublicReaderSource[]) {
  const revalidating = ref(false);
  let epoch = 0;
  let running = false;
  let disposed = false;

  function invalidate() {
    epoch++;
    revalidating.value = true;
    // Clear both data and errors before refetch. The template additionally
    // masks all old public content while revalidation is incomplete.
    for (const source of sources) source.clear();
  }

  async function revalidate() {
    if (disposed || !revalidating.value || running || document.visibilityState !== 'visible') return;
    const started = epoch;
    running = true;
    try {
      // Every source is independently refreshed. Nuxt stores HTTP failures
      // in its AsyncData error; don't restore any previously cleared values.
      await Promise.allSettled(sources.map(source => source.refresh()));
    } finally {
      running = false;
      if (disposed || document.visibilityState !== 'visible') return;
      if (started === epoch) revalidating.value = false;
      else void revalidate();
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') invalidate();
    else void revalidate();
  }
  function onPageHide() { invalidate(); }
  function onPageShow(event: PageTransitionEvent) {
    if (!event.persisted) return;
    invalidate();
    void revalidate();
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
  });
  onBeforeUnmount(() => {
    disposed = true;
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
  });
  return { revalidating };
}
