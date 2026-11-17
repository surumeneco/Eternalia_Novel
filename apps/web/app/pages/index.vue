<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
import { formatJstDisplay } from '~/utils/jst-publication-time';
const { t, language } = useUiLocale();
const { data: series, pending, error, refresh, clear: clearSeries } = await useFetch<ReaderNode[]>('/api/public/series');
const { data: recent, pending: recentPending, error: recentError, refresh: refreshRecent, clear: clearRecent } =
  await useFetch<ReaderNode[]>('/api/public/recent');
const { revalidating } = usePublicReaderRevalidation([
  { clear: clearSeries, refresh },
  { clear: clearRecent, refresh: refreshRecent },
]);
function contentLink(node: ReaderNode) {
  return node.kind === 'chapter' ? '/read/' + node.id : '/items/' + node.id;
}
const kindNames = computed<Partial<Record<ReaderNode['kind'], string>>>(() => ({
  chapter: t('chapter'), tip: t('tip'), tipSection: t('tipSection'), word: t('word'),
  grammar: t('grammar'), event: t('event'),
}));
// Reader sections are meaningful only after a series has been selected.
// Do not repeat the four series-owned domains as global content categories.
const seriesById = computed(() => new Map((series.value ?? []).map(item => [item.id, item])));
</script>

<template>
  <div>
    <ReaderPanel>
      <h1>Eternalia</h1>
      <p>{{ t('siteDescription') }}</p>
    </ReaderPanel>
    <ReaderPanel class="reader-panel-spaced">
      <h2 class="section-heading">{{ t('publishedSeries') }}</h2>
      <AuthorCreateLink kind="series" :label="t('studioNewSeries')" />
      <ReadingSkeleton v-if="revalidating || pending" :label="t('loading')" />
      <div v-else-if="error" role="alert">
        <p class="error-text">{{ t('seriesLoadError') }}</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <ul v-else-if="series?.length" class="reader-list">
        <li v-for="item in series" :key="item.id">
          <NuxtLink :to="'/series/' + item.id">{{ item.content.title }}</NuxtLink>
        </li>
      </ul>
      <p v-else>{{ t('seriesEmpty') }}</p>
    </ReaderPanel>
    <ReaderPanel class="reader-panel-spaced">
      <h2 class="section-heading">{{ t('recent') }}</h2>
      <ReadingSkeleton v-if="revalidating || recentPending" :label="t('readerLoadingRecent')" />
      <div v-else-if="recentError" role="alert">
        <p class="error-text">{{ t('recentLoadError') }}</p>
        <button class="inline-action" type="button" @click="refreshRecent()">{{ t('retry') }}</button>
      </div>
      <ol v-else-if="recent?.length" class="reader-list">
        <li v-for="item in recent" :key="item.id">
          <NuxtLink :to="contentLink(item)">{{ item.content.title }}</NuxtLink>
          <span class="note">
            · <NuxtLink v-if="item.seriesId && seriesById.has(item.seriesId)"
              :to="'/series/' + item.seriesId">{{ seriesById.get(item.seriesId)?.content.title }}</NuxtLink>
            · {{ kindNames[item.kind] ?? item.kind }}
            · <time :datetime="new Date(item.publishedAt).toISOString()">{{ formatJstDisplay(item.publishedAt, language) }}</time>
          </span>
        </li>
      </ol>
      <p v-else>{{ t('recentEmpty') }}</p>
    </ReaderPanel>
  </div>
</template>

<style scoped>
 .reader-panel-spaced { margin-top: 1.2rem; }
.reader-list .recent-series-link {
  display: inline; padding: 0; border: 0; background: transparent;
  text-decoration: underline; border-radius: 0;
}
.reader-list .recent-series-link:hover { background: transparent; }
</style>
