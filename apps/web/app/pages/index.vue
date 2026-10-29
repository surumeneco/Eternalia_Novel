<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { data: series, pending, error, refresh } = await useFetch<ReaderNode[]>('/api/public/series');
const { data: recent, pending: recentPending, error: recentError, refresh: refreshRecent } =
  await useFetch<ReaderNode[]>('/api/public/recent');
function contentLink(node: ReaderNode) {
  return node.kind === 'chapter' ? '/read/' + node.id : '/items/' + node.id;
}
const kindNames: Partial<Record<ReaderNode['kind'], string>> = {
  chapter: '章', tip: '設定', tipSection: '設定項目', word: '単語',
  grammar: '文法', event: '出来事',
};
const sections = [
  { to: '/stories', label: 'ストーリー', description: '編・部・章と本文' },
  { to: '/tips', label: '設定集', description: 'カテゴリ・設定・項目' },
  { to: '/dictionaries', label: '辞書', description: '言語・語彙・文法' },
  { to: '/timeline', label: '年表', description: '年代区分と出来事' },
] as const;
</script>

<template>
  <div>
    <ReaderPanel>
      <h1>Eternalia</h1>
      <p>ストーリー、設定集、辞書、年表をシリーズごとに閲覧できます。</p>
      <h2 class="section-heading">コンテンツ</h2>
      <ul class="reader-list">
        <li v-for="section in sections" :key="section.to">
          <NuxtLink :to="section.to">{{ section.label }} <span class="note">— {{ section.description }}</span></NuxtLink>
        </li>
      </ul>
    </ReaderPanel>
    <ReaderPanel class="reader-panel-spaced">
      <h2 class="section-heading">公開シリーズ</h2>
      <p v-if="pending" role="status">読み込み中です。</p>
      <div v-else-if="error" role="alert">
        <p class="error-text">公開シリーズを取得できませんでした。</p>
        <button class="inline-action" type="button" @click="refresh()">再試行</button>
      </div>
      <ul v-else-if="series?.length" class="reader-list">
        <li v-for="item in series" :key="item.id">
          <NuxtLink :to="'/series/' + item.id">{{ item.content.title }}</NuxtLink>
        </li>
      </ul>
      <p v-else>現在、公開中のシリーズはありません。</p>
    </ReaderPanel>
    <ReaderPanel class="reader-panel-spaced">
      <h2 class="section-heading">新着・更新</h2>
      <p v-if="recentPending" role="status">更新情報を読み込んでいます。</p>
      <div v-else-if="recentError" role="alert">
        <p class="error-text">更新情報を取得できませんでした。</p>
        <button class="inline-action" type="button" @click="refreshRecent()">再試行</button>
      </div>
      <ol v-else-if="recent?.length" class="reader-list">
        <li v-for="item in recent" :key="item.id">
          <NuxtLink :to="contentLink(item)">{{ item.content.title }}</NuxtLink>
          <span class="note"> · {{ kindNames[item.kind] ?? item.kind }}
            · <time :datetime="new Date(item.publishedAt).toISOString()">{{ new Date(item.publishedAt).toLocaleDateString('ja-JP') }}</time>
          </span>
        </li>
      </ol>
      <p v-else>公開された更新情報はありません。</p>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.reader-panel-spaced { margin-top: 1.2rem; }
</style>
