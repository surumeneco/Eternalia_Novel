<script setup lang="ts">
const menuOpen = ref(false);
const navigation = [
  { to: '/', label: 'ホーム' },
  { to: '/stories', label: 'ストーリー' },
  { to: '/tips', label: '設定集' },
  { to: '/dictionaries', label: '辞書' },
  { to: '/timeline', label: '年表' },
] as const;
</script>

<template>
  <div id="top" class="site-shell">
    <header class="site-header">
      <div class="header-inner">
        <NuxtLink class="brand" to="/">Eternalia</NuxtLink>
        <button type="button" class="nav-toggle" :aria-expanded="menuOpen" aria-controls="global-navigation"
          @click="menuOpen = !menuOpen">{{ menuOpen ? '閉じる' : 'メニュー' }}</button>
        <nav id="global-navigation" aria-label="グローバルナビゲーション" class="header-nav" :class="{ 'is-open': menuOpen }">
          <NuxtLink v-for="link in navigation" :key="link.to" :to="link.to" @click="menuOpen = false">
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <div class="site-content">
      <aside class="site-aside" aria-label="補助情報">
        <section class="stone-panel">
          <h2>閲覧する</h2>
          <nav aria-label="資料の種類">
            <ul>
              <li v-for="link in navigation.slice(1)" :key="link.to"><NuxtLink :to="link.to">{{ link.label }}</NuxtLink></li>
            </ul>
          </nav>
        </section>
        <section class="stone-panel">
          <h2>更新情報</h2>
          <p class="note">公開された更新情報を表示する予定です。</p>
        </section>
      </aside>
      <main id="main-content" class="site-main">
        <slot />
        <p><a href="#top">ページ先頭へ戻る</a></p>
      </main>
    </div>
    <footer class="site-footer"><small>Eternalia — ストーリー・設定集・辞書・年表</small></footer>
  </div>
</template>
