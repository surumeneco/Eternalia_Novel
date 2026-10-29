<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { t } = useUiLocale();
const { data: series, pending, error, refresh } = await useFetch<ReaderNode[]>('/api/public/series');
const { data: recent, pending: recentPending, error: recentError, refresh: refreshRecent } =
  await useFetch<ReaderNode[]>('/api/public/recent');
function contentLink(node: ReaderNode) {
  return node.kind === 'chapter' ? '/read/' + node.id : '/items/' + node.id;
}
const kindNames = computed<Partial<Record<ReaderNode['kind'], string>>>(() => ({
  chapter: t('chapter'), tip: t('tip'), tipSection: t('tipSection'), word: t('word'),
  grammar: t('grammar'), event: t('event'),
}));
const sections = computed(() => [
  { to: '/stories', label: t('stories'), description: t('storyDescription') },
  { to: '/tips', label: t('tips'), description: t('tipsDescription') },
  { to: '/dictionaries', label: t('dictionaries'), description: t('dictionaryDescription') },
  { to: '/timeline', label: t('timeline'), description: t('timelineDescription') },
] as const);
</script>

<template>
  <div>
    <ReaderPanel>
      <h1>Eternalia</h1>
      <p>{{ t('siteDescription') }}</p>
      <h2 class="section-heading">{{ t('content') }}</h2>
      <ul class="reader-list">
        <li v-for="section in sections" :key="section.to">
          <NuxtLink :to="section.to">{{ section.label }} <span class="note">— {{ section.description }}</span></NuxtLink>
        </li>
      </ul>
    </ReaderPanel>
    <ReaderPanel class="reader-panel-spaced">
      <h2 class="section-heading">{{ t('publishedSeries') }}</h2>
      <ReadingSkeleton v-if="pending" :label="t('loading')" />
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
      <ReadingSkeleton v-if="recentPending" label="更新情報を読み込んでいます。" />
      <div v-else-if="recentError" role="alert">
        <p class="error-text">{{ t('recentLoadError') }}</p>
        <button class="inline-action" type="button" @click="refreshRecent()">{{ t('retry') }}</button>
      </div>
      <ol v-else-if="recent?.length" class="reader-list">
        <li v-for="item in recent" :key="item.id">
          <NuxtLink :to="contentLink(item)">{{ item.content.title }}</NuxtLink>
          <span class="note"> · {{ kindNames[item.kind] ?? item.kind }}
            · <time :datetime="new Date(item.publishedAt).toISOString()">{{ new Date(item.publishedAt).toLocaleDateString('ja-JP') }}</time>
          </span>
        </li>
      </ol>
      <p v-else>{{ t('recentEmpty') }}</p>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.reader-panel-spaced { margin-top: 1.2rem; }
</style>
