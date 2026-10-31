<script setup lang="ts">
import type { WordMeaning, WordEtymology } from '@eternalia/contracts';
const { t } = useUiLocale();

type Choice = { id: string; title: string; parentId?: string | null };
const props = defineProps<{
  modelValue: string;
  languages: Choice[];
  words: Choice[];
  wordClasses: Choice[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const meanings = ref<WordMeaning[]>([]);
const parseError = ref('');
watch(() => props.modelValue, raw => {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) throw new Error('Not a meaning array');
    meanings.value = value as WordMeaning[];
    parseError.value = '';
  } catch {
    parseError.value = t('wordMeaningParseError');
  }
}, { immediate: true });
watch(meanings, value => {
  if (parseError.value) return;
  const encoded = JSON.stringify(value);
  if (encoded !== props.modelValue) emit('update:modelValue', encoded);
}, { deep: true });
function addMeaning() {
  if (parseError.value || meanings.value.length >= 30) return;
  meanings.value.push({ id: crypto.randomUUID(), partOfSpeech: '', definition: '', etymologies: [] });
}
function addOrigin(meaning: WordMeaning) {
  if (meaning.etymologies.length >= 12) return;
  meaning.etymologies.push({ id: crypto.randomUUID(), note: '' });
}
function removeOrigin(meaning: WordMeaning, origin: WordEtymology) {
  meaning.etymologies = meaning.etymologies.filter(item => item.id !== origin.id);
}
function wordsOf(origin: WordEtymology) {
  return props.words.filter(word => word.parentId === origin.languageId);
}
</script>

<template>
  <fieldset class="word-meanings">
    <legend>{{ t('wordMeaningsLegend') }}</legend>
    <p class="note">{{ t('wordMeaningsNote') }}</p>
    <p v-if="parseError" class="error-text" role="alert">{{ parseError }}</p>
    <template v-else>
      <section v-for="(meaning, index) in meanings" :key="meaning.id" class="word-meaning">
        <div class="word-meaning-header">
          <h3>{{ t('wordMeaningTitle') }} {{ index + 1 }}</h3>
          <button type="button" class="inline-action" @click="meanings.splice(index, 1)">{{ t('wordMeaningDelete') }}</button>
        </div>
        <label>{{ t('wordPartOfSpeech') }}
          <select v-if="wordClasses.length" v-model="meaning.partOfSpeech">
            <option value="">{{ t('wordUnspecified') }}</option>
            <option v-for="wordClass in wordClasses" :key="wordClass.id" :value="wordClass.title">
              {{ wordClass.title }}
            </option>
            <option v-if="meaning.partOfSpeech && !wordClasses.some(entry => entry.title === meaning.partOfSpeech)"
              :value="meaning.partOfSpeech">{{ meaning.partOfSpeech }}（{{ t('wordLegacy') }}）</option>
          </select>
          <input v-else v-model="meaning.partOfSpeech" type="text" maxlength="80" :placeholder="t('wordPartOfSpeechPlaceholder')" />
        </label>
        <label>{{ t('wordDefinition') }}
          <textarea v-model="meaning.definition" maxlength="2000" rows="3" />
        </label>
        <h4>{{ t('wordEtymologies') }}</h4>
        <div v-for="origin in meaning.etymologies" :key="origin.id" class="word-origin">
          <label>{{ t('wordReferenceLanguage') }}
            <select v-model="origin.languageId" @change="origin.wordId = undefined">
              <option value="">{{ t('wordNoReference') }}</option>
              <option v-for="language in languages" :key="language.id" :value="language.id">{{ language.title }}</option>
            </select>
          </label>
          <label>{{ t('wordReferenceWord') }}
            <select v-model="origin.wordId" :disabled="!origin.languageId">
              <option value="">{{ t('wordNoReference') }}</option>
              <option v-for="word in wordsOf(origin)" :key="word.id" :value="word.id">{{ word.title }}</option>
            </select>
          </label>
          <label>{{ t('wordOriginNote') }}
            <textarea v-model="origin.note" maxlength="1000" rows="2" />
          </label>
          <button type="button" class="inline-action" @click="removeOrigin(meaning, origin)">{{ t('wordOriginDelete') }}</button>
        </div>
        <button type="button" class="inline-action" :disabled="meaning.etymologies.length >= 12" @click="addOrigin(meaning)">
          {{ t('wordOriginAdd') }}
        </button>
      </section>
      <button type="button" class="inline-action" :disabled="meanings.length >= 30" @click="addMeaning">
        {{ t('wordMeaningAdd') }}
      </button>
    </template>
  </fieldset>
</template>

<style scoped>
.word-meanings { min-width:0;margin:1rem 0;border:1px solid var(--color-border-base);border-radius:var(--radius-panel);padding:1rem; }
.word-meaning { padding:1rem 0;border-bottom:1px solid var(--color-border-base); }
.word-meaning-header { display:flex;gap:1rem;align-items:center;justify-content:space-between; }
.word-meaning-header h3 { margin:0; }
.word-origin { border-left:3px solid var(--color-concept-main);padding:.25rem .75rem;margin:.75rem 0; }
.word-meanings label { font-weight:normal; }
.word-meanings input,.word-meanings select,.word-meanings textarea { width:100%;min-width:0; }
</style>
