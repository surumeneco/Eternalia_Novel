<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { t } = useUiLocale();
const route = useRoute();
const id = computed(() => String(route.params.id));
const { data: chapter, pending, error, refresh } = await useFetch<ReaderNode>(
  () => '/api/public/items/' + encodeURIComponent(id.value),
);
const { data: ancestry } = await useFetch<ReaderNode[]>(
  () => '/api/public/items/' + encodeURIComponent(id.value) + '/path',
);
const seriesId = computed(() => ancestry.value?.find(node => node.kind === 'series')?.id ?? '');
const { data: tree } = await useAsyncData(
  () => 'read-series-' + seriesId.value,
  () => seriesId.value
    ? $fetch<ReaderNode[]>('/api/public/series/' + encodeURIComponent(seriesId.value) + '/tree').catch(() => [])
    : Promise.resolve([] as ReaderNode[]),
  { watch: [seriesId] },
);
const series = computed(() => tree.value?.find(n => n.id === seriesId.value && n.kind === 'series'));
const siblings = computed(() => {
  if (!chapter.value || chapter.value.kind !== 'chapter') return [];
  if (!(tree.value ?? []).some(n => n.id === chapter.value?.id)) return [];
  return (tree.value ?? []).filter(n => n.kind === 'chapter' && n.parentId === chapter.value?.parentId)
    .sort((a,b) => a.order - b.order || a.content.title.localeCompare(b.content.title));
});
const currentIndex = computed(() => siblings.value.findIndex(n => n.id === id.value));
const previous = computed(() => currentIndex.value > 0 ? siblings.value[currentIndex.value - 1] : null);
const next = computed(() => currentIndex.value >= 0 ? siblings.value[currentIndex.value + 1] ?? null : null);
function chapterLink(chapterId: string) {
  return '/read/' + chapterId;
}
</script>
<template>
  <div>
    <TopicPath :items="[
      { label: t('home'), to: '/' },
      { label: t('stories'), to: '/stories' },
      ...(series ? [{ label: series.content.title, to: '/stories/' + series.id }] : []),
      { label: chapter?.content.title ?? t('chapter') },
    ]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" label="本文を読み込んでいます。" />
      <div v-else-if="error || chapter?.kind !== 'chapter'" role="alert">
        <h1>章を表示できません</h1>
        <p class="error-text">章が存在しないか、公開されていません。</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <article v-else>
        <h1>{{ chapter.content.title }}</h1>
        <AuthorEditLink :item-id="chapter.id" />
        <p class="note">公開：<time :datetime="new Date(chapter.publishedAt).toISOString()">{{ new Date(chapter.publishedAt).toLocaleDateString('ja-JP') }}</time></p>
        <RichContent :source="chapter.content.body" paged />
        <nav v-if="seriesId" class="chapter-navigation" aria-label="章の移動">
          <NuxtLink v-if="previous" :to="chapterLink(previous.id)">前の章：{{ previous.content.title }}</NuxtLink>
          <NuxtLink :to="'/stories/' + seriesId">目次へ戻る</NuxtLink>
          <NuxtLink v-if="next" :to="chapterLink(next.id)">次の章：{{ next.content.title }}</NuxtLink>
        </nav>
      </article>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.chapter-navigation { border-top: 1px solid var(--color-border-base); padding-top: 1rem; margin-top: 2rem; display: flex; flex-wrap: wrap; justify-content: space-between; gap: .7rem; }
</style>
