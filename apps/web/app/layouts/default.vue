<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
import { mobileBackgroundAllowed } from '~/utils/mobile-shell-background';
const { t, language } = useUiLocale();
const route = useRoute();
const clientReady = ref(false);
const navOpen = ref(false);
const asideOpen = ref(false);
const languageOpen = ref(false);
const navToggle = ref<HTMLButtonElement | null>(null);
const asideToggle = ref<HTMLButtonElement | null>(null);
const localeToggle = ref<HTMLButtonElement | null>(null);
const navPanel = ref<HTMLElement | null>(null);
const asidePanel = ref<HTMLElement | null>(null);
const mainContent = ref<HTMLElement | null>(null);
const overlayOpen = computed(() => !mobileBackgroundAllowed(navOpen.value ? 'primary' : asideOpen.value ? 'secondary' : 'closed'));
let mobileViewport: MediaQueryList | undefined;
function activeOpener() { return navOpen.value ? navToggle.value : asideOpen.value ? asideToggle.value : null; }
function activePanel() { return navOpen.value ? navPanel.value : asideOpen.value ? asidePanel.value : null; }
function focusable(panel: HTMLElement | null): HTMLElement[] {
  return Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    .filter(element => element.getClientRects().length > 0);
}
async function closeMobileMenu(restore = true) {
  const opener = activeOpener();
  navOpen.value = false;
  asideOpen.value = false;
  await nextTick();
  if (restore && !overlayOpen.value && opener?.getClientRects().length) opener.focus();
}
async function toggleMobileMenu(menu: 'nav' | 'aside') {
  if ((menu === 'nav' && navOpen.value) || (menu === 'aside' && asideOpen.value)) {
    await closeMobileMenu();
    return;
  }
  languageOpen.value = false;
  navOpen.value = menu === 'nav';
  asideOpen.value = menu === 'aside';
  await nextTick();
  if (!(menu === 'nav' ? navOpen.value : asideOpen.value)) return;
  const panel = activePanel();
  (focusable(panel)[0] ?? panel)?.focus();
}
function onViewportChange(event: MediaQueryListEvent) {
  if (!event.matches && overlayOpen.value) void closeMobileMenu(false);
}
async function toggleLanguageMenu() {
  if (overlayOpen.value) await closeMobileMenu(false);
  languageOpen.value = !languageOpen.value;
}
async function closeLanguageMenu() {
  languageOpen.value = false;
  await nextTick();
  if (!overlayOpen.value) localeToggle.value?.focus();
}
function followMobileLink() {
  if (overlayOpen.value) void closeMobileMenu(false).then(() => mainContent.value?.focus());
}
// Menu visibility is a separate cache from the active author editor. Hiding
// stale controls must not clear the editor's authentication/data refs.
const { data: auth, error: authError, clear: clearAuth, refresh: refreshAuth } =
  await useFetch<{ authenticated: boolean }>('/api/auth/me', { key: 'eternalia-author-menu-auth' });
async function recheckMenuAuth() {
  await refreshAuth();
  if (authError.value) clearAuth();
}
usePublicReaderRevalidation([{clear:clearAuth,refresh:recheckMenuAuth}]);
function onAuthFocus() {
  if (document.visibilityState === 'visible') void recheckMenuAuth();
}
const { data: recent, error: recentError, clear: clearRecent, refresh: refreshRecent } =
  await useFetch<ReaderNode[]>('/api/public/recent');
const { revalidating: recentRevalidating } = usePublicReaderRevalidation([
  { clear: clearRecent, refresh: refreshRecent },
]);
function dismissMenus(event: KeyboardEvent) {
  if (event.defaultPrevented || document.querySelector('dialog[open]')) return;
  if (event.key === 'Escape') {
    if (overlayOpen.value) { event.preventDefault(); void closeMobileMenu(); }
    else if (languageOpen.value) { event.preventDefault(); void closeLanguageMenu(); }
    return;
  }
  if (event.key !== 'Tab' || !overlayOpen.value) return;
  const opener = activeOpener();
  const panel = activePanel();
  const items = [...(opener ? [opener] : []), ...focusable(panel)];
  if (!items.length) return;
  event.preventDefault();
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = current < 0 ? (event.shiftKey ? items.length - 1 : 0)
    : (current + (event.shiftKey ? -1 : 1) + items.length) % items.length;
  items[next]?.focus();
}
onMounted(() => {
  clientReady.value = true;
  void recheckMenuAuth();
  window.addEventListener('focus', onAuthFocus);
  mobileViewport = window.matchMedia('(max-width: 1100px)');
  mobileViewport.addEventListener('change', onViewportChange);
  window.addEventListener('keydown', dismissMenus);
});
onBeforeUnmount(() => {
  if (import.meta.client) {
    mobileViewport?.removeEventListener('change', onViewportChange);
    window.removeEventListener('keydown', dismissMenus);
    window.removeEventListener('focus', onAuthFocus);
  }
});
watch(() => route.fullPath, () => {
  if (overlayOpen.value) followMobileLink();
  languageOpen.value = false;
  if (import.meta.client) void recheckMenuAuth();
});
const seriesId = computed(() => {
  const match = /^\/series\/([^/]+)/.exec(route.path);
  if (match) return decodeURIComponent(match[1]!);
  return typeof route.query.series === 'string' ? route.query.series : null;
});
const navigation = computed(() => [
  { to: '/', label: t('home') },
  ...(seriesId.value ? [
    { to: '/series/' + seriesId.value, label: t('readerKindSeries') },
    { to: '/series/' + seriesId.value + '/stories', label: t('stories') },
    { to: '/series/' + seriesId.value + '/settings', label: t('tips') },
    { to: '/series/' + seriesId.value + '/dictionaries', label: t('dictionaries') },
    { to: '/series/' + seriesId.value + '/timeline', label: t('timeline') },
  ] : []),
  { to: '/search', label: t('shellSearch') },
  ...(auth.value?.authenticated === true ? [{ to: '/admin', label: t('adminHome') }] : []),
]);
function recentLink(node: ReaderNode) {
  return '/jump/' + encodeURIComponent(node.id);
}
function selectLanguage(value: 'ja' | 'en') {
  language.value = value;
  void closeLanguageMenu();
}
useHead({ htmlAttrs: { lang: computed(() => language.value === 'en' ? 'en' : 'ja') } });
</script>
<template>
  <div id="top" class="site-shell">
    <a class="skip-to-content" href="#main-content" :inert="overlayOpen">{{ t('skipToContent') }}</a>
    <header class="site-header">
      <div class="header-inner">
        <button ref="asideToggle" type="button" class="aside-toggle icon-button" :disabled="!clientReady" :aria-expanded="asideOpen"
          :aria-label="t('sidebarToggle')" aria-controls="updates-aside" @click="toggleMobileMenu('aside')">
          <i class="bi bi-list" aria-hidden="true" />
        </button>
        <NuxtLink class="brand" to="/" :inert="overlayOpen">Eternalia</NuxtLink>
        <nav ref="navPanel" id="global-navigation" tabindex="-1" :inert="asideOpen" :aria-label="t('shellGlobalNav')" class="header-nav" :class="{ 'is-open': navOpen }">
          <NuxtLink v-for="link in navigation" :key="link.to" :to="link.to" @click="followMobileLink()">{{ link.label }}</NuxtLink>
          <NuxtLink v-if="!auth?.authenticated" class="mobile-login" to="/login" @click="followMobileLink()">{{ t('loginTitle') }}</NuxtLink>
        </nav>
        <div class="header-actions">
          <div class="locale-container">
            <button ref="localeToggle" type="button" class="locale-switch icon-button" :disabled="!clientReady"
              :aria-label="t('selectLanguage')" :aria-expanded="languageOpen" aria-controls="language-list"
              @click="toggleLanguageMenu()">
              <i class="bi bi-translate" aria-hidden="true" />
            </button>
            <div v-if="languageOpen" id="language-list" class="language-dropdown" role="group" :aria-label="t('selectLanguage')">
              <button type="button" :aria-pressed="language === 'ja'" @click="selectLanguage('ja')">日本語</button>
              <button type="button" :aria-pressed="language === 'en'" @click="selectLanguage('en')">English</button>
            </div>
          </div>
          <button ref="navToggle" type="button" class="nav-toggle icon-button" :disabled="!clientReady"
            :aria-label="t('navigationToggle')" :aria-expanded="navOpen" aria-controls="global-navigation"
            @click="toggleMobileMenu('nav')">
            <i class="bi bi-list" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
    <div v-if="overlayOpen" class="mobile-menu-backdrop" aria-hidden="true" @click="closeMobileMenu()" />
    <div class="site-content">
      <aside ref="asidePanel" id="updates-aside" tabindex="-1" :inert="navOpen" class="site-aside" :class="{ 'is-open': asideOpen }" :aria-label="t('shellAside')">
        <section class="stone-panel">
          <h2>{{ t('recent') }}</h2>
          <ol v-if="!recentRevalidating && !recentError && recent?.length" class="recent-aside-list">
            <li v-for="node in recent.slice(0, 10)" :key="node.id"><NuxtLink :to="recentLink(node)" @click="followMobileLink()">{{ node.content.title }}</NuxtLink></li>
          </ol>
          <p v-else>{{ t('noRecent') }}</p>
        </section>
      </aside>
      <main ref="mainContent" id="main-content" :inert="overlayOpen" class="site-main" tabindex="-1">
        <slot />
        <div class="page-top-panel"><a href="#top"><i class="bi bi-arrow-up-circle" aria-hidden="true" /> {{ t('backToTop') }}</a></div>
      </main>
    </div>
    <footer class="site-footer" :inert="overlayOpen">
      <small>Eternalia — {{ t('shellFooterDescription') }} <NuxtLink v-if="auth?.authenticated" to="/admin">{{ t('adminHome') }}</NuxtLink></small>
    </footer>
    <AppDialogHost />
  </div>
</template>
<style scoped>
.header-actions { margin-left:auto; display:flex; align-items:center; gap:.5rem; }
.icon-button { display:grid;place-items:center;width:2.7rem;height:2.7rem; border:1px solid #003f58;
  background:#00394c;color:#fff;flex:none; font-size:1.35rem; }
.nav-toggle.icon-button,.aside-toggle.icon-button { display:none; }
.locale-container { position:relative; }
.language-dropdown { position:absolute;z-index:120;right:0;top:calc(100% + .4rem);
  display:grid;min-width:10rem;padding:.35rem;background:var(--color-background-base);border:1px solid var(--color-border-base); box-shadow:0 10px 25px #0008; }
.language-dropdown button { color:var(--color-text-base);background:transparent;border:0;padding:.6rem;text-align:left; }
.language-dropdown button:hover,.language-dropdown button[aria-pressed="true"] { background:var(--color-background-soft); }
.recent-aside-list { list-style:none;padding:0;margin:0;display:grid;gap:.6rem; }
.recent-aside-list li { border-bottom:1px solid var(--color-border-base);padding-bottom:.5rem;overflow-wrap:anywhere; }
.mobile-login { display:none; }
.mobile-menu-backdrop { position:fixed;inset:0;z-index:60;background:#0006;touch-action:none; }
:global(body:has(.mobile-menu-backdrop)) { overflow:hidden; }
.header-nav.is-open, .site-aside.is-open { overscroll-behavior:contain; }
@media(max-width:1100px) {
  .nav-toggle.icon-button,.aside-toggle.icon-button {display:grid;}
  .site-header { position:relative; z-index:80; }
  .header-inner { flex-wrap:nowrap; }
  .header-actions { margin-left:auto; }
  .header-nav { position:absolute;top:100%;right:.5rem;width:min(18rem,calc(100vw - 1rem));max-height:calc(100dvh - 4.5rem);overflow-y:auto;
    padding:.6rem;background:var(--color-background-base);box-shadow:0 12px 26px #0008;border:1px solid var(--color-border-base); }
  .header-nav.is-open { display:flex; }
  .header-nav a { color:var(--color-text-base); }
  .header-nav a:visited { color:var(--color-text-base); }
  .mobile-login { display:block; }
}
</style>
