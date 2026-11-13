<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { t, language } = useUiLocale();
const route = useRoute();
const { data: item, pending, error, refresh } = await useFetch<ReaderNode>(
  () => '/api/public/items/' + encodeURIComponent(String(route.params.id)),
);
const displayDetails = computed(() => Object.fromEntries(
  Object.entries(item.value?.content.details ?? {}).filter(([key]) =>
    !((item.value?.kind === 'tip' && (key === 'tags' || key === 'relatedTips')) ||
      (item.value?.kind === 'word' && key === 'meanings') ||
      (item.value?.kind === 'language' && (key === 'characters' || key === 'wordClasses')))),
));
const { data: ancestry } = await useFetch<ReaderNode[]>(
  () => '/api/public/items/' + encodeURIComponent(String(route.params.id)) + '/path',
);
const crumbs = computed(() => {
  const kind = item.value?.kind;
  const section = kind && ['volume','part','chapter'].includes(kind) ? {label:t('stories'),to:'/stories'} :
    kind && ['category','tip','tipSection'].includes(kind) ? {label:t('tips'),to:'/tips'} :
    kind && ['language','word','grammar'].includes(kind) ? {label:t('dictionaries'),to:'/dictionaries'} :
    kind && ['periodization','event'].includes(kind) ? {label:t('timeline'),to:'/timeline'} : null;
  const chain = ancestry.value ?? [];
  const parts = chain.length > 0 ? chain : item.value ? [item.value] : [];
  return [
    {label:t('home'),to:'/'},
    ...(section ? [section] : []),
    ...parts.map((node,index) => ({
      label:node.content.title,
      to:index===parts.length-1 ? undefined :
        node.kind==='series' ? '/series/'+node.id : '/items/'+node.id,
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
    <TopicPath :items="crumbs" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" :label="t('readerLoadingItem')" />
      <div v-else-if="error" role="alert">
        <h1>{{ t('readerErrorItem') }}</h1>
        <p class="error-text">{{ t('readerErrorNotPublic') }}</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else-if="item">
        <p class="note">{{ kindNames[item.kind] || item.kind }}</p>
        <h1>{{ item.content.title }}</h1>
        <AuthorEditLink :item-id="item.id" />
        <p class="note">{{ t('readerPublishedUpdated') }}<time :datetime="new Date(item.publishedAt).toISOString()">{{ new Date(item.publishedAt).toLocaleString(language === 'en' ? 'en-US' : 'ja-JP') }}</time></p>
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
