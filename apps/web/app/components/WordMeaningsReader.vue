<script setup lang="ts">
import type { WordMeaning, WordEtymology } from '@eternalia/contracts';

const props = defineProps<{ serialized?: string }>();
const meanings = computed<WordMeaning[]>(() => {
  if (!props.serialized) return [];
  try {
    const parsed: unknown = JSON.parse(props.serialized);
    return Array.isArray(parsed) ? parsed as WordMeaning[] : [];
  } catch { return []; }
});
function visibleOrigins(meaning: WordMeaning): WordEtymology[] {
  return meaning.etymologies.filter(origin =>
    !!origin.languageTitle || !!origin.wordTitle || !!origin.note.trim());
}
</script>

<template>
  <section v-if="meanings.length" class="meaning-reader" aria-label="単語の意味">
    <h2>意味</h2>
    <ol class="meaning-list">
      <li v-for="meaning in meanings" :key="meaning.id">
        <p v-if="meaning.partOfSpeech" class="note meaning-class">{{ meaning.partOfSpeech }}</p>
        <p class="meaning-definition">{{ meaning.definition }}</p>
        <div v-if="visibleOrigins(meaning).length" class="meaning-origins">
          <h3>語源</h3>
          <ul>
            <li v-for="origin in visibleOrigins(meaning)" :key="origin.id">
              <template v-if="origin.languageId && origin.languageTitle">
                <NuxtLink :to="'/items/' + origin.languageId">{{ origin.languageTitle }}</NuxtLink>
              </template>
              <template v-if="origin.wordId && origin.wordTitle">
                <span> · </span><NuxtLink :to="'/items/' + origin.wordId">{{ origin.wordTitle }}</NuxtLink>
              </template>
              <span v-if="origin.note"> {{ origin.note }}</span>
            </li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.meaning-reader { margin:1.2rem 0; }
.meaning-list { padding-inline-start:1.5rem; }
.meaning-list > li { padding:.8rem 0;border-bottom:1px solid var(--color-border-base); }
.meaning-class { margin:0 0 .3rem; }
.meaning-definition { white-space:pre-wrap;overflow-wrap:anywhere; }
.meaning-origins { padding:.4rem 0 .2rem; }
.meaning-origins h3 { font-size:1rem;margin:.25rem 0; }
.meaning-origins ul { padding-inline-start:1.25rem; }
</style>
