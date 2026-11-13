<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
import { formatJstDisplay } from '~/utils/jst-publication-time';
import { publishedChapterSequence } from '~/utils/chapter-navigation';
const { t, language } = useUiLocale();
const route = useRoute();
const id = computed(() => String(route.params.id));
const { data: chapter, pending, error, refresh } = await useFetch<ReaderNode>(
  () => '/api/public/items/' + encodeURIComponent(id.value),
);
const { data: ancestry, error: ancestryError, refresh: refreshAncestry } = await useFetch<ReaderNode[]>(
  () => '/api/public/items/' + encodeURIComponent(id.value) + '/path',
);
const seriesId = computed(() => ancestry.value?.find(node => node.kind === 'series')?.id ?? '');
const { data: tree, error: treeError, refresh: refreshTree } = await useAsyncData(
  () => 'read-series-' + seriesId.value,
  () => seriesId.value
    ? $fetch<ReaderNode[]>('/api/public/series/' + encodeURIComponent(seriesId.value) + '/tree')
    : Promise.resolve([] as ReaderNode[]),
  { watch: [seriesId] },
);
const series = computed(() => tree.value?.find(n => n.id === seriesId.value && n.kind === 'series'));
const chapterSequence = computed(() => {
  if (chapter.value?.kind !== 'chapter' || !seriesId.value) return [];
  const publishedNodes = tree.value ?? [];
  if (!publishedNodes.some(node => node.id === chapter.value?.id)) return [];
  // Continue reading across Part and Volume boundaries, excluding unpublished paths.
  return publishedChapterSequence(publishedNodes, seriesId.value);
});
const currentIndex = computed(() => chapterSequence.value.findIndex(n => n.id === id.value));
const previous = computed(() => currentIndex.value > 0 ? chapterSequence.value[currentIndex.value - 1] : null);
const next = computed(() => currentIndex.value >= 0 ? chapterSequence.value[currentIndex.value + 1] ?? null : null);
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
      <ReadingSkeleton v-if="pending" :label="t('readerLoadingChapter')" />
      <div v-else-if="error || chapter?.kind !== 'chapter'" role="alert">
        <h1>{{ t('readerErrorChapter') }}</h1>
        <p class="error-text">{{ t('readerChapterUnavailable') }}</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <article v-else>
        <h1>{{ chapter.content.title }}</h1>
        <AuthorEditLink :item-id="chapter.id" />
        <p class="note">{{ t('readerPublishedOn') }}<time :datetime="new Date(chapter.publishedAt).toISOString()">{{ formatJstDisplay(chapter.publishedAt, language) }}</time></p>
        <RichContent :source="chapter.content.body" :pages="chapter.content.pages" paged />
        <div v-if="ancestryError || treeError" role="alert" class="navigation-error">
          <p>{{ t('readerChapterNavUnavailable') }}</p>
          <button type="button" class="inline-action"
            @click="ancestryError ? refreshAncestry() : refreshTree()">{{ t('readerChapterReloadList') }}</button>
        </div>
        <nav v-if="seriesId && !treeError" class="chapter-navigation" :aria-label="t('readerChapterNavigation')">
          <NuxtLink v-if="previous" :to="chapterLink(previous.id)">{{ t('readerPreviousChapter') }}{{ previous.content.title }}</NuxtLink>
          <NuxtLink :to="'/stories/' + seriesId">{{ t('readerBackToToc') }}</NuxtLink>
          <NuxtLink v-if="next" :to="chapterLink(next.id)">{{ t('readerNextChapter') }}{{ next.content.title }}</NuxtLink>
        </nav>
      </article>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.navigation-error { margin-top:1.5rem; }
.chapter-navigation { border-top: 1px solid var(--color-border-base); padding-top: 1rem; margin-top: 2rem; display: flex; flex-wrap: wrap; justify-content: space-between; gap: .7rem; }
</style>
