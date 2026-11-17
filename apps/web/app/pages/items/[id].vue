<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
import { formatJstDisplay } from '~/utils/jst-publication-time';
const { t, language } = useUiLocale();
const route = useRoute();
const { data: item, pending, error, refresh, clear: clearItem } = await useFetch<ReaderNode>(
  () => '/api/public/items/' + encodeURIComponent(String(route.params.id)),
);
const displayDetails = computed(() => Object.fromEntries(
  Object.entries(item.value?.content.details ?? {}).filter(([key]) =>
    !((item.value?.kind === 'tip' && (key === 'tags' || key === 'relatedTips')) ||
      (item.value?.kind === 'word' && key === 'meanings') ||
      (item.value?.kind === 'language' && (key === 'characters' || key === 'wordClasses')))),
));
const { data: ancestry, refresh: refreshAncestry, clear: clearAncestry } = await useFetch<ReaderNode[]>(
  () => '/api/public/items/' + encodeURIComponent(String(route.params.id)) + '/path',
);
const { revalidating } = usePublicReaderRevalidation([
  { clear: clearItem, refresh },
  { clear: clearAncestry, refresh: refreshAncestry },
]);
const crumbs = computed(() => {
  const chain = ancestry.value ?? [];
  const parts = chain.length > 0 ? chain : item.value ? [item.value] : [];
  const root = parts.find(node => node.kind === 'series');
  const kind = item.value?.kind;
  const area = kind && ['volume','part','chapter'].includes(kind) ? 'stories' :
    kind && ['category','tip','tipSection'].includes(kind) ? 'tips' :
    kind && ['language','word','grammar'].includes(kind) ? 'dictionaries' :
    kind && ['periodization','event'].includes(kind) ? 'timeline' : null;
  const label = area === 'stories' ? t('stories') : area === 'tips' ? t('tips') :
    area === 'dictionaries' ? t('dictionaries') : area === 'timeline' ? t('timeline') : '';
  return [
    { label: t('home'), to: '/' },
    ...(root ? [{ label: root.content.title, to: '/series/' + root.id }] : []),
    ...(root && area ? [{ label, to: '/' + area + '/' + root.id }] : []),
    ...parts.filter(node => node.kind !== 'series').map((node, index, rest) => ({
      label: node.content.title,
      to: index === rest.length - 1 ? undefined : '/items/' + node.id,
    })),
  ];
});
const kindNames = computed<Record<string,string>>(() => ({
  volume: t('readerKindVolume'), part: t('readerKindPart'),
  chapter: t('readerKindChapter'), category: t('readerKindCategory'),
  tip: t('readerKindTip'), tipSection: t('readerKindTipSection'),
  language: t('readerKindLanguage'), word: t('readerKindWord'),
  grammar: t('readerKindGrammar'), periodization: t('readerKindPeriodization'),
  event: t('readerKindEvent'),
}));
</script>
<template>
  <div>
    <TopicPath v-if="!revalidating" :items="crumbs" />
    <ReaderPanel>
      <ReadingSkeleton v-if="revalidating || pending" :label="t('readerLoadingItem')" />
      <div v-else-if="error" role="alert">
        <h1>{{ t('readerErrorItem') }}</h1>
        <p class="error-text">{{ t('readerErrorNotPublic') }}</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else-if="item">
        <p class="note">{{ kindNames[item.kind] || item.kind }}</p>
        <h1>{{ item.content.title }}</h1>
        <AuthorEditLink :item-id="item.id" />
        <p class="note">{{ t('readerPublishedUpdated') }}<time :datetime="new Date(item.publishedAt).toISOString()">{{ formatJstDisplay(item.publishedAt, language) }}</time></p>
        <RichContent :source="item.content.body" />
        <TipLinksReader v-if="item.kind === 'tip'" :tags="item.content.details.tags"
          :related-tips="item.content.details.relatedTips" />
        <WordMeaningsReader v-if="item.kind === 'word'" :serialized="item.content.details.meanings" />
        <LanguageStructureReader v-if="item.kind === 'language'"
          :characters="item.content.details.characters" :word-classes="item.content.details.wordClasses" />
        <dl v-if="Object.keys(displayDetails).length" class="reader-details">
          <template v-for="(value, key) in displayDetails" :key="key">
            <dt>{{ key }}</dt><dd>{{ value }}</dd>
          </template>
        </dl>
      </template>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.reader-details { display: grid; grid-template-columns: minmax(5rem, auto) 1fr; gap: .5rem 1rem; }
.reader-details dt { color: var(--color-text-note); }
.reader-details dd { margin: 0; }
</style>
