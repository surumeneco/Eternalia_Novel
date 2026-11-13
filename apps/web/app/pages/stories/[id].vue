<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { t } = useUiLocale();
const route = useRoute();
const id = computed(() => String(route.params.id));
const { data: tree, pending, error, refresh } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(id.value) + '/tree',
);
const series = computed(() => tree.value?.find(node => node.kind === 'series' && node.id === id.value));
const sorted = (parentId: string, kind: ReaderNode['kind']): ReaderNode[] =>
  (tree.value ?? []).filter(n => n.kind === kind && n.parentId === parentId)
    .sort((a,b) => a.order - b.order || a.content.title.localeCompare(b.content.title));
const volumes = computed(() => sorted(id.value, 'volume'));
const partsOf = (volumeId: string) => sorted(volumeId, 'part');
const chaptersOf = (partId: string) => sorted(partId, 'chapter');
</script>
<template>
  <div>
    <TopicPath :items="[{ label: t('home'), to: '/' }, { label: t('stories'), to: '/stories' }, { label: series?.content.title ?? t('readerKindSeries') }]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" :label="t('readerLoadingToc')" />
      <div v-else-if="error || !series" role="alert">
        <h1>{{ t('readerErrorStories') }}</h1>
        <p class="error-text">{{ t('readerSeriesUnavailable') }}</p>
        <button type="button" class="inline-action" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else>
        <h1>{{ series.content.title }}</h1>
        <AuthorEditLink :item-id="series.id" />
        <RichContent v-if="series.content.body" :source="series.content.body" />
        <h2 class="section-heading">{{ t('readerToc') }}</h2>
        <p v-if="!volumes.length">{{ t('readerNoVolumes') }}</p>
        <section v-for="volume in volumes" :key="volume.id" class="story-volume">
          <h3><NuxtLink :to="'/items/' + volume.id">{{ volume.content.title }}</NuxtLink></h3>
          <p v-if="volume.content.body" class="note story-summary">{{ volume.content.body }}</p>
          <div v-for="part in partsOf(volume.id)" :key="part.id" class="story-part">
            <h4><NuxtLink :to="'/items/' + part.id">{{ part.content.title }}</NuxtLink></h4>
            <p v-if="part.content.body" class="note story-summary">{{ part.content.body }}</p>
            <ul class="reader-list" v-if="chaptersOf(part.id).length">
              <li v-for="chapter in chaptersOf(part.id)" :key="chapter.id">
                <NuxtLink :to="{ path: '/read/' + chapter.id, query: { series: id } }">{{ chapter.content.title }}</NuxtLink>
              </li>
            </ul>
            <p v-else class="note">{{ t('readerNoChapters') }}</p>
          </div>
        </section>
      </template>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.story-volume { margin-block: 1.75rem; }
.story-volume h3 { border-bottom: 1px solid var(--color-border-base); padding-bottom: .5rem; }
.story-part { margin: 1.25rem 0 1.25rem 1rem; }
.story-part h4 { margin: 0 0 .6rem; }
.story-summary { white-space: pre-wrap; }
</style>
