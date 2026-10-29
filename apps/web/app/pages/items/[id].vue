<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const route = useRoute();
const { data: item, pending, error, refresh } = await useFetch<ReaderNode>(
  () => '/api/public/items/' + encodeURIComponent(String(route.params.id)),
);
const displayDetails = computed(() => Object.fromEntries(
  Object.entries(item.value?.content.details ?? {}).filter(([key]) =>
    !((item.value?.kind === 'word' && key === 'meanings') ||
      (item.value?.kind === 'language' && (key === 'characters' || key === 'wordClasses')))),
));
const kindNames: Record<string,string> = {
  volume: '編', part: '部', chapter: '章', category: 'カテゴリ',
  tip: '設定', tipSection: '設定項目', language: '言語', word: '単語',
  grammar: '文法', periodization: '年代区分', event: '出来事',
};
</script>
<template>
  <div>
    <TopicPath :items="[{ label: 'ホーム', to: '/' }, { label: item?.content.title || '公開項目' }]" />
    <ReaderPanel>
      <p v-if="pending" role="status">公開項目を読み込んでいます。</p>
      <div v-else-if="error" role="alert">
        <h1>項目を表示できません</h1>
        <p class="error-text">存在しないか、現在公開されていない可能性があります。</p>
        <button class="inline-action" type="button" @click="refresh()">再試行</button>
      </div>
      <template v-else-if="item">
        <p class="note">{{ kindNames[item.kind] || item.kind }}</p>
        <h1>{{ item.content.title }}</h1>
        <AuthorEditLink :item-id="item.id" />
        <RichContent :source="item.content.body" />
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
