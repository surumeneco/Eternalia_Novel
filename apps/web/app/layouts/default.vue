<script setup lang="ts">
const menuOpen = ref(false);
// SSR markup is visible before Vue attaches the locale-switch click handler.
// Keep the control inert until this layout has actually mounted in the browser.
const clientReady = ref(false);
onMounted(() => { clientReady.value = true; });
const { t, language } = useUiLocale();
const route = useRoute();
// Four content areas belong to a selected series, never the global site root.
const seriesId = computed(() => {
  const match = /^\/(?:series|stories|tips|dictionaries|timeline)\/([^/]+)$/.exec(route.path);
  if (match) return decodeURIComponent(match[1]!);
  return typeof route.query.series === 'string' ? route.query.series : null;
});
function toggleLanguage() {
  language.value = language.value === 'en' ? 'ja' : 'en';
  menuOpen.value = false;
}
useHead({ htmlAttrs: { lang: computed(() => language.value === 'en' ? 'en' : 'ja') } });
const navigation = computed(() => [
  { to: '/', label: t('home') },
  ...(seriesId.value ? [
    { to: '/series/' + seriesId.value, label: t('readerKindSeries') },
    { to: '/stories/' + seriesId.value, label: t('stories') },
    { to: '/tips/' + seriesId.value, label: t('tips') },
    { to: '/dictionaries/' + seriesId.value, label: t('dictionaries') },
    { to: '/timeline/' + seriesId.value, label: t('timeline') },
  ] : []),
  { to: '/search', label: t('shellSearch') },
]);
</script>

<template>
  <div id="top" class="site-shell">
    <a class="skip-to-content" href="#main-content">{{ t('skipToContent') }}</a>
    <header class="site-header">
      <div class="header-inner">
        <NuxtLink class="brand" to="/">Eternalia</NuxtLink>
        <button type="button" class="nav-toggle" :disabled="!clientReady" :aria-expanded="menuOpen" aria-controls="global-navigation"
          @click="menuOpen = !menuOpen">{{ menuOpen ? t('close') : t('menu') }}</button>
        <nav id="global-navigation" :aria-label="t('shellGlobalNav')" class="header-nav" :class="{ 'is-open': menuOpen }">
          <NuxtLink v-for="link in navigation" :key="link.to" :to="link.to" @click="menuOpen = false">
            {{ link.label }}
          </NuxtLink>
        </nav>
        <button type="button" class="locale-switch" :disabled="!clientReady" :aria-label="language === 'en' ? t('shellSwitchToJapanese') : t('shellSwitchToEnglish')"
          @click="toggleLanguage">{{ language === 'en' ? '日本語' : 'English' }}</button>
      </div>
    </header>
    <div class="site-content">
      <aside class="site-aside" :aria-label="t('shellAside')">
        <section class="stone-panel">
          <h2>{{ seriesId ? t('readerSeriesAreas') : t('publishedSeries') }}</h2>
          <nav :aria-label="t('shellResourceTypes')">
            <ul>
              <li v-for="link in (seriesId ? navigation.slice(1) : [{ to: '/', label: t('publishedSeries') }])" :key="link.to">
                <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </nav>
        </section>
      </aside>
      <main id="main-content" class="site-main" tabindex="-1">
        <slot />
        <p><a href="#top">{{ t('backToTop') }}</a></p>
      </main>
    </div>
    <footer class="site-footer">
      <small>Eternalia — {{ t('shellFooterDescription') }} ／ <NuxtLink to="/studio">{{ t('studio') }}</NuxtLink></small>
    </footer>
  </div>
</template>

<style scoped>
.locale-switch { margin-left: auto; flex-shrink: 0; white-space: nowrap; border: 1px solid #003f58;
  border-radius: var(--radius-input, 4px); background: #f8fcff; color: #08232c; padding: .35rem .5rem;
  font: inherit; cursor: pointer; }
.locale-switch:disabled { cursor: default; opacity: .65; }
.locale-switch:focus-visible { outline: 3px solid #003f58; outline-offset: 2px; }
@media (max-width: 720px) {
  .locale-switch { margin-left: 0; font-size: .875rem; }
}
</style>
