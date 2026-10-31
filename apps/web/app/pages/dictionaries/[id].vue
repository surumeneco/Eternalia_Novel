<script setup lang="ts">
import type { ReaderKind, ReaderNode } from '~/types/reader';
const { t } = useUiLocale();
import type { WordMeaning } from '@eternalia/contracts';

const route = useRoute();
const seriesId = computed(() => String(route.params.id));
const { data: tree, pending, error, refresh } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(seriesId.value) + '/tree',
);
const series = computed(() => tree.value?.find(
  node => node.kind === 'series' && node.id === seriesId.value,
));
const languageId = ref('');
const query = ref('');
const partOfSpeech = ref('');
watch(seriesId, () => { languageId.value = ''; partOfSpeech.value = ''; query.value = ''; });
function children(parentId: string, kind: ReaderKind) {
  return (tree.value ?? []).filter(node => node.kind === kind && node.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja'));
}
const languages = computed(() => children(seriesId.value, 'language'));
const activeLanguages = computed(() => languages.value.filter(
  language => !languageId.value || language.id === languageId.value,
));
const allWords = computed(() => activeLanguages.value.flatMap(language =>
  children(language.id, 'word').map(word => ({ language, word })),
));
function meaningsOf(word: ReaderNode): WordMeaning[] {
  const value = word.content.details.meanings;
  if (!value) return [];
  try {
    const decoded: unknown = JSON.parse(value);
    return Array.isArray(decoded) ? decoded as WordMeaning[] : [];
  } catch { return []; }
}
function wordParts(word: ReaderNode): string[] {
  const senses = meaningsOf(word).map(meaning => meaning.partOfSpeech).filter(Boolean);
  if (!senses.length && word.content.details.partOfSpeech) senses.push(word.content.details.partOfSpeech);
  return [...new Set(senses)];
}
const partsOfSpeech = computed(() => [...new Set(
  allWords.value.flatMap(({ word }) => wordParts(word)),
)].sort((a, b) => a.localeCompare(b, 'ja')));
const visibleWords = computed(() => allWords.value.filter(({ word }) => {
  const needle = query.value.trim().toLocaleLowerCase();
  return (!partOfSpeech.value || wordParts(word).includes(partOfSpeech.value)) &&
    (!needle || [
      word.content.title, word.content.body, ...wordParts(word),
      ...meaningsOf(word).map(meaning => meaning.definition),
    ].some(value => value.toLocaleLowerCase().includes(needle)));
}));
const visibleGrammar = computed(() => activeLanguages.value.flatMap(language =>
  children(language.id, 'grammar').map(grammar => ({ language, grammar })),
));
watch(languageId, () => { partOfSpeech.value = ''; });
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: t('home'), to: '/' },
      { label: t('dictionaries'), to: '/dictionaries' },
      { label: series?.content.title ?? 'シリーズ' },
    ]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" label="辞書を読み込んでいます。" />
      <div v-else-if="error || !series" role="alert">
        <h1>辞書を表示できません</h1>
        <p class="error-text">シリーズが存在しないか、公開されていません。</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else>
        <h1>{{ series.content.title }} — 辞書</h1>
        <div class="dictionary-filters">
          <label>言語
            <select v-model="languageId">
              <option value="">すべての言語</option>
              <option v-for="language in languages" :key="language.id" :value="language.id">
                {{ language.content.title }}
              </option>
            </select>
          </label>
          <label>単語を検索
            <input v-model="query" type="search" placeholder="綴り・説明" />
          </label>
          <label>品詞
            <select v-model="partOfSpeech">
              <option value="">すべての品詞</option>
              <option v-for="part in partsOfSpeech" :key="part" :value="part">{{ part }}</option>
            </select>
          </label>
        </div>
        <p v-if="!languages.length">現在公開中の言語はありません。</p>
        <template v-else>
          <section v-for="language in activeLanguages" :key="language.id" class="dictionary-language">
            <h2 class="section-heading">
              <NuxtLink :to="'/items/' + language.id">{{ language.content.title }}</NuxtLink>
            </h2>
            <p v-if="language.content.body" class="dictionary-description">{{ language.content.body }}</p>
            <h3>単語</h3>
            <ul v-if="visibleWords.some(entry => entry.language.id === language.id)" class="reader-list">
              <li v-for="entry in visibleWords.filter(entry => entry.language.id === language.id)" :key="entry.word.id">
                <NuxtLink :to="'/items/' + entry.word.id">{{ entry.word.content.title }}</NuxtLink>
                <span v-if="wordParts(entry.word).length" class="note">（{{ wordParts(entry.word).join('・') }}）</span>
                <p v-if="entry.word.content.body" class="dictionary-description">{{ entry.word.content.body }}</p>
                <ul v-if="meaningsOf(entry.word).length" class="word-definitions">
                  <li v-for="meaning in meaningsOf(entry.word)" :key="meaning.id">
                    <span v-if="meaning.partOfSpeech" class="note">{{ meaning.partOfSpeech }}：</span>{{ meaning.definition }}
                  </li>
                </ul>
              </li>
            </ul>
            <p v-else class="note">条件に一致する公開単語はありません。</p>
            <h3>文法</h3>
            <ul v-if="visibleGrammar.some(entry => entry.language.id === language.id)" class="reader-list">
              <li v-for="entry in visibleGrammar.filter(entry => entry.language.id === language.id)" :key="entry.grammar.id">
                <NuxtLink :to="'/items/' + entry.grammar.id">{{ entry.grammar.content.title }}</NuxtLink>
                <p v-if="entry.grammar.content.body" class="dictionary-description">{{ entry.grammar.content.body }}</p>
              </li>
            </ul>
            <p v-else class="note">公開中の文法項目はありません。</p>
          </section>
        </template>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.dictionary-filters { display:flex;flex-wrap:wrap;gap:1rem;margin:1.25rem 0; }
.dictionary-filters label { flex:1 1 11rem;min-width:0; }
.dictionary-filters input,.dictionary-filters select {
  display:block;width:100%;margin-top:.4rem;padding:.55rem;
  color:var(--color-text-base);background:var(--color-background-input);
  border:1px solid var(--color-border-base);border-radius:var(--radius-input);
}
.dictionary-language { margin:1.5rem 0 2rem; }
.dictionary-language h3 { margin-top:1.5rem; }
.word-definitions { padding-inline-start:1.4rem;margin:.5rem 0; }
.word-definitions li { overflow-wrap:anywhere;white-space:pre-wrap; }
.dictionary-description { white-space:pre-wrap;overflow-wrap:anywhere;margin:.5rem 0; }
</style>
