<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const props = defineProps<{
  title: string;
  description: string;
  section: 'stories' | 'tips' | 'dictionaries' | 'timeline';
}>();
const { data: series, pending, error, refresh } = await useFetch<ReaderNode[]>('/api/public/series');
function collectionLink(id: string) {
  if (props.section === 'stories') return '/stories/' + id;
  if (props.section === 'tips') return '/tips/' + id;
  return { path: '/series/' + id, query: { section: props.section } };
}
</script>
<template>
  <div>
    <TopicPath :items="[{ label: 'ホーム', to: '/' }, { label: props.title }]" />
    <ReaderPanel>
      <h1>{{ props.title }}</h1>
      <p v-if="pending" role="status">公開シリーズを読み込んでいます。</p>
      <div v-else-if="error" role="alert">
        <p class="error-text">公開シリーズを取得できませんでした。</p>
        <button class="inline-action" type="button" @click="refresh()">再試行</button>
      </div>
      <ul v-else-if="series?.length" class="reader-list">
        <li v-for="item in series" :key="item.id">
          <NuxtLink :to="collectionLink(item.id)">{{ item.content.title }}</NuxtLink>
        </li>
      </ul>
      <p v-else>現在閲覧できるシリーズはありません。</p>
    </ReaderPanel>
  </div>
</template>
