<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const route = useRoute();
const { data: item, pending, error, refresh } = await useFetch<ReaderNode>(
  () => '/api/public/items/' + encodeURIComponent(String(route.params.id)),
);
const pages = computed(() => item.value?.content.body.split('[[page]]') ?? []);
const kindNames: Record<string,string> = {
  volume: '編', part: '部', chapter: '章', category: 'カテゴリ',
  tip: '設定', tipSection: '設定項目', language: '言語', word: '単語',
  grammar: '文法', periodization: '年代区分', event: '出来事',
};
</script>

<template>
  <div>
    <TopicPath :items="[{ label: 'ホーム', to: '/' }, { label: item?.content.title || '公開項目' }]" />
    <ReaderPanel>
      <p v-if="pending" role="status">公開項目を読み込んでいます。</p>
      <div v-else-if="error" role="alert">
        <h1>項目を表示できません</h1>
        <p class="error-text">存在しないか、現在公開されていない可能性があります。</p>
        <button class="inline-action" type="button" @click="refresh()">再試行</button>
      </div>
      <template v-else-if="item">
        <p class="note">{{ kindNames[item.kind] || item.kind }}</p>
        <h1>{{ item.content.title }}</h1>
        <div v-for="(page, pageIndex) in pages" :key="pageIndex" class="reader-page">
          <p v-if="pages.length > 1" class="note">ページ {{ pageIndex + 1 }} / {{ pages.length }}</p>
          <p class="reader-prose">{{ page }}</p>
        </div>
        <dl v-if="Object.keys(item.content.details).length" class="reader-details">
          <template v-for="(value, key) in item.content.details" :key="key">
            <dt>{{ key }}</dt><dd>{{ value }}</dd>
          </template>
        </dl>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.reader-page + .reader-page { border-top: 1px solid var(--color-border-base); margin-top: 1.5rem; padding-top: 1.5rem; }
.reader-prose { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.95; }
.reader-details { display: grid; grid-template-columns: minmax(5rem, auto) 1fr; gap: .5rem 1rem; }
.reader-details dt { color: var(--color-text-note); }
.reader-details dd { margin: 0; }
</style>
