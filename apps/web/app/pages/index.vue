<script setup lang="ts">
interface PublicSeries { id: string; title: string }
const { data: series, pending, error, refresh } = await useFetch<PublicSeries[]>('/api/public/series');
</script>
<template>
  <main class="content">
    <header><h1>Eternalia</h1><p>小説・設定・辞書・年表</p></header>
    <section aria-labelledby="series-heading">
      <h2 id="series-heading">公開シリーズ</h2>
      <p v-if="pending" role="status">読み込み中です。</p>
      <div v-else-if="error" role="alert">
        <p>公開シリーズを取得できませんでした。</p>
        <button type="button" @click="refresh()">再試行</button>
      </div>
      <ul v-else-if="series?.length"><li v-for="item in series" :key="item.id">{{ item.title }}</li></ul>
      <p v-else>現在、公開中のシリーズはありません。</p>
    </section>
  </main>
</template>
<style scoped>
.content { max-width: 64rem; margin: 0 auto; padding: clamp(1rem, 4vw, 3rem); font-family: system-ui, sans-serif; line-height: 1.7; }
button { cursor: pointer; }
</style>
