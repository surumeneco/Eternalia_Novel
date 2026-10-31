<script setup lang="ts">
import type { ReaderKind, ReaderNode } from '~/types/reader';

type Domain = 'all' | 'stories' | 'tips' | 'dictionaries' | 'timeline';
type SortOrder = 'recent' | 'title' | 'manual';
const { t } = useUiLocale();
const route = useRoute();
const selectedSeriesId = ref(typeof route.query.series === 'string' ? route.query.series : '');
const query = ref('');
const domain = ref<Domain>('all');
const sortOrder = ref<SortOrder>('recent');
const domains: Array<{ id: Domain; label: string }> = [
  { id: 'all', label: t('studioFilterAll') },
  { id: 'stories', label: t('stories') },
  { id: 'tips', label: t('tips') },
  { id: 'dictionaries', label: t('dictionaries') },
  { id: 'timeline', label: t('timeline') },
];
const domainKinds: Record<Exclude<Domain, 'all'>, ReaderKind[]> = {
  stories: ['volume', 'part', 'chapter'],
  tips: ['category', 'tip', 'tipSection'],
  dictionaries: ['language', 'word', 'grammar'],
  timeline: ['periodization', 'event'],
};
const kindLabels: Record<ReaderKind, string> = {
  series: t('studioKindSeries'), volume: t('studioKindVolume'), part: t('studioKindPart'), chapter: t('chapter'),
  category: t('studioKindCategory'), tip: t('tip'), tipSection: t('tipSection'),
  language: t('studioKindLanguage'), word: t('word'), grammar: t('grammar'),
  periodization: t('studioKindPeriodization'), event: t('event'),
};
const { data: series, pending: seriesPending, error: seriesError, refresh: refreshSeries } =
  await useFetch<ReaderNode[]>('/api/public/series');
const { data: tree, pending: treePending, error: treeError, refresh: refreshTree } =
  await useAsyncData<ReaderNode[]>(
    'search-public-series-tree',
    async () => selectedSeriesId.value
      ? await $fetch<ReaderNode[]>('/api/public/series/' + encodeURIComponent(selectedSeriesId.value) + '/tree')
      : [],
    { watch: [selectedSeriesId], default: () => [] },
  );
const selectedSeries = computed(() => (series.value ?? [])
  .find(item => item.id === selectedSeriesId.value));
const byId = computed(() => new Map((tree.value ?? []).map(node => [node.id, node])));
const kindOrder: Record<ReaderKind, number> = {
  series: -1, volume: 0, part: 0, chapter: 0,
  category: 1, tip: 0, tipSection: 0,
  language: 2, word: 0, grammar: 1,
  periodization: 3, event: 0,
};
function manualPath(node: ReaderNode): number[] {
  const path = [kindOrder[node.kind], node.order];
  const visited = new Set<string>([node.id]);
  let parentId = node.parentId;
  while (parentId && !visited.has(parentId) && path.length < 24) {
    visited.add(parentId);
    const parent = byId.value.get(parentId);
    if (!parent || parent.kind === 'series') break;
    path.unshift(kindOrder[parent.kind], parent.order);
    parentId = parent.parentId;
  }
  return path;
}
function manualOrder(a: ReaderNode, b: ReaderNode): number {
  const left = manualPath(a), right = manualPath(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i]! - right[i]!;
  }
  return left.length - right.length || a.id.localeCompare(b.id);
}
function searchFields(node: ReaderNode): string[] {
  const fields = [node.content.title, node.content.body];
  const parent = node.parentId ? byId.value.get(node.parentId) : null;
  if (parent) fields.push(parent.content.title);
  if (node.kind === 'tip' && node.content.details.tags) {
    try {
      const tags: unknown = JSON.parse(node.content.details.tags);
      if (Array.isArray(tags)) fields.push(...tags.filter((tag): tag is string => typeof tag === 'string'));
    } catch { /* Malformed public metadata must not crash search. */ }
  }
  if (node.kind === 'word' && node.content.details.meanings) {
    try {
      const meanings: unknown = JSON.parse(node.content.details.meanings);
      if (Array.isArray(meanings)) for (const meaning of meanings) {
        if (meaning && typeof meaning === 'object') {
          const sense = meaning as Record<string, unknown>;
          if (typeof sense.definition === 'string') fields.push(sense.definition);
          if (typeof sense.partOfSpeech === 'string') fields.push(sense.partOfSpeech);
        }
      }
    } catch { /* Ignore unsupported legacy data. */ }
  }
  return fields;
}
const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase());
const results = computed(() => (tree.value ?? [])
  .filter(node => node.kind !== 'series')
  .filter(node => domain.value === 'all' || domainKinds[domain.value].includes(node.kind))
  .filter(node => !normalizedQuery.value || searchFields(node)
    .some(value => value.toLocaleLowerCase().includes(normalizedQuery.value)))
  .sort((a, b) => {
    if (sortOrder.value === 'recent') return b.publishedAt - a.publishedAt || a.id.localeCompare(b.id);
    if (sortOrder.value === 'title') return a.content.title.localeCompare(b.content.title, 'ja') || a.id.localeCompare(b.id);
    return manualOrder(a, b);
  }));
function itemLink(node: ReaderNode): string {
  return (node.kind === 'chapter' ? '/read/' : '/items/') + node.id;
}
function parentName(node: ReaderNode): string {
  return node.parentId ? byId.value.get(node.parentId)?.content.title ?? '' : '';
}
</script>

<template>
  <div>
    <TopicPath :items="[{ label: t('home'), to: '/' }, { label: t('searchTitle') }]" />
    <ReaderPanel>
      <h1>{{ t('searchTitle') }}</h1>
      <p class="note">{{ t('searchIntro') }}</p>
      <ReadingSkeleton v-if="seriesPending" :label="t('loading')" />
      <div v-else-if="seriesError" role="alert">
        <p class="error-text">{{ t('seriesLoadError') }}</p>
        <button type="button" class="inline-action" @click="refreshSeries()">{{ t('retry') }}</button>
      </div>
      <template v-else>
        <div class="search-filters">
          <label>{{ t('studioKindSeries') }}
            <select v-model="selectedSeriesId">
              <option value="">{{ t('searchSelectSeries') }}</option>
              <option v-for="item in series" :key="item.id" :value="item.id">{{ item.content.title }}</option>
            </select>
          </label>
          <label>{{ t('searchQueryLabel') }}
            <input v-model="query" type="search" maxlength="150" :placeholder="t('searchPlaceholder')" />
          </label>
          <label>{{ t('shellResourceTypes') }}
            <select v-model="domain">
              <option v-for="item in domains" :key="item.id" :value="item.id">{{ item.label }}</option>
            </select>
          </label>
          <label>{{ t('searchSortLabel') }}
            <select v-model="sortOrder">
              <option value="recent">{{ t('searchRecent') }}</option>
              <option value="title">{{ t('searchTitleSort') }}</option>
              <option value="manual">{{ t('searchManual') }}</option>
            </select>
          </label>
        </div>
        <p v-if="!series?.length" class="note">{{ t('seriesEmpty') }}</p>
        <p v-else-if="!selectedSeriesId" class="note">{{ t('searchChooseSeries') }}</p>
        <ReadingSkeleton v-else-if="treePending" :label="t('searchLoading')" />
        <div v-else-if="treeError || !selectedSeries" role="alert">
          <p class="error-text">{{ t('searchLoadError') }}</p>
          <button type="button" class="inline-action" @click="refreshTree()">{{ t('retry') }}</button>
        </div>
        <template v-else>
          <p role="status" class="note">{{ selectedSeries.content.title }}：{{ results.length }} {{ t('searchResultsUnit') }}</p>
          <ul v-if="results.length" class="reader-list">
            <li v-for="item in results" :key="item.id" class="search-result">
              <NuxtLink :to="itemLink(item)">{{ item.content.title }}</NuxtLink>
              <span class="note"> · {{ kindLabels[item.kind] }}
                <template v-if="parentName(item)"> · {{ parentName(item) }}</template>
              </span>
              <p v-if="item.content.body" class="result-summary">{{ item.content.body }}</p>
              <small class="note">{{ t('searchPublishedUpdated') }}
                <time :datetime="new Date(item.publishedAt).toISOString()">{{ new Date(item.publishedAt).toLocaleDateString('ja-JP') }}</time>
              </small>
            </li>
          </ul>
          <p v-else>{{ t('searchEmpty') }}</p>
        </template>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.search-filters { display:grid; grid-template-columns:repeat(auto-fit,minmax(12rem,1fr)); gap:.75rem 1rem; margin:1.2rem 0; }
.search-filters label { display:block; min-width:0; }
.search-filters select,.search-filters input {
  display:block; width:100%; margin-top:.35rem; padding:.6rem; border:1px solid var(--color-border-base);
  border-radius:var(--radius-input); background:var(--color-background-input); color:var(--color-text-base);
}
.search-result { padding:.8rem 0; overflow-wrap:anywhere; }
.result-summary { white-space:pre-wrap; overflow-wrap:anywhere; display:-webkit-box; -webkit-box-orient:vertical;
  -webkit-line-clamp:3; line-clamp:3; overflow:hidden; margin:.4rem 0; }
</style>
