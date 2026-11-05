<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { t } = useUiLocale();
const props = defineProps<{
  title: string;
  description: string;
  section: 'stories' | 'tips' | 'dictionaries' | 'timeline';
}>();
const { data: series, pending, error, refresh } = await useFetch<ReaderNode[]>('/api/public/series');
function collectionLink(id: string) {
  if (props.section === 'stories') return '/stories/' + id;
  if (props.section === 'tips') return '/tips/' + id;
  if (props.section === 'dictionaries') return '/dictionaries/' + id;
  if (props.section === 'timeline') return '/timeline/' + id;
  return { path: '/series/' + id, query: { section: props.section } };
}
</script>
<template>
  <div>
    <TopicPath :items="[{ label: t('home'), to: '/' }, { label: props.title }]" />
    <ReaderPanel>
      <h1>{{ props.title }}</h1>
      <ReadingSkeleton v-if="pending" :label="t('collectionLoading')" />
      <div v-else-if="error" role="alert">
        <p class="error-text">{{ t('seriesLoadError') }}</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <ul v-else-if="series?.length" class="reader-list">
        <li v-for="item in series" :key="item.id">
          <NuxtLink :to="collectionLink(item.id)">{{ item.content.title }}</NuxtLink>
        </li>
      </ul>
      <p v-else>{{ t('collectionEmpty') }}</p>
    </ReaderPanel>
  </div>
</template>
