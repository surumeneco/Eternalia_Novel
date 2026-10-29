<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
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
    <TopicPath :items="[{ label: 'ホーム', to: '/' }, { label: 'ストーリー', to: '/stories' }, { label: series?.content.title ?? 'シリーズ' }]" />
    <ReaderPanel>
      <p v-if="pending" role="status">目次を読み込んでいます。</p>
      <div v-else-if="error || !series" role="alert">
        <h1>ストーリーを表示できません</h1>
        <p class="error-text">シリーズが存在しないか、公開されていません。</p>
        <button type="button" class="inline-action" @click="refresh()">再試行</button>
      </div>
      <template v-else>
        <h1>{{ series.content.title }}</h1>
        <RichContent v-if="series.content.body" :source="series.content.body" />
        <h2 class="section-heading">目次</h2>
        <p v-if="!volumes.length">公開中の編はありません。</p>
        <section v-for="volume in volumes" :key="volume.id" class="story-volume">
          <h3>{{ volume.content.title }}</h3>
          <p v-if="volume.content.body" class="note story-summary">{{ volume.content.body }}</p>
          <div v-for="part in partsOf(volume.id)" :key="part.id" class="story-part">
            <h4>{{ part.content.title }}</h4>
            <ul class="reader-list" v-if="chaptersOf(part.id).length">
              <li v-for="chapter in chaptersOf(part.id)" :key="chapter.id">
                <NuxtLink :to="{ path: '/read/' + chapter.id, query: { series: id } }">{{ chapter.content.title }}</NuxtLink>
              </li>
            </ul>
            <p v-else class="note">公開中の章はありません。</p>
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
