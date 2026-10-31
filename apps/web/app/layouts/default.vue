<script setup lang="ts">
const menuOpen = ref(false);
const { t } = useUiLocale();
const navigation = computed(() => [
  { to: '/', label: t('home') },
  { to: '/stories', label: t('stories') },
  { to: '/tips', label: t('tips') },
  { to: '/dictionaries', label: t('dictionaries') },
  { to: '/timeline', label: t('timeline') },
  { to: '/search', label: t('shellSearch') },
] as const);
</script>

<template>
  <div id="top" class="site-shell">
    <header class="site-header">
      <div class="header-inner">
        <NuxtLink class="brand" to="/">Eternalia</NuxtLink>
        <button type="button" class="nav-toggle" :aria-expanded="menuOpen" aria-controls="global-navigation"
          @click="menuOpen = !menuOpen">{{ menuOpen ? t('close') : t('menu') }}</button>
        <nav id="global-navigation" :aria-label="t('shellGlobalNav')" class="header-nav" :class="{ 'is-open': menuOpen }">
          <NuxtLink v-for="link in navigation" :key="link.to" :to="link.to" @click="menuOpen = false">
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <div class="site-content">
      <aside class="site-aside" :aria-label="t('shellAside')">
        <section class="stone-panel">
          <h2>{{ t('browse') }}</h2>
          <nav :aria-label="t('shellResourceTypes')">
            <ul>
              <li v-for="link in navigation.slice(1)" :key="link.to"><NuxtLink :to="link.to">{{ link.label }}</NuxtLink></li>
            </ul>
          </nav>
        </section>
      </aside>
      <main id="main-content" class="site-main">
        <slot />
        <p><a href="#top">{{ t('backToTop') }}</a></p>
      </main>
    </div>
    <footer class="site-footer">
      <small>Eternalia — {{ t('shellFooterDescription') }} ／ <NuxtLink to="/studio">{{ t('studio') }}</NuxtLink></small>
    </footer>
  </div>
</template>
