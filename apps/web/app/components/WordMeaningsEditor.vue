<script setup lang="ts">
import type { WordMeaning, WordEtymology } from '@eternalia/contracts';

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
    parseError.value = '意味データを読み込めません。元データの確認が必要です。';
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
    <legend>単語の意味と語源</legend>
    <p class="note">意味は品詞が同じでも別々に保持します。語源は意味ごとに登録できます。</p>
    <p v-if="parseError" class="error-text" role="alert">{{ parseError }}</p>
    <template v-else>
      <section v-for="(meaning, index) in meanings" :key="meaning.id" class="word-meaning">
        <div class="word-meaning-header">
          <h3>意味 {{ index + 1 }}</h3>
          <button type="button" class="inline-action" @click="meanings.splice(index, 1)">意味を削除</button>
        </div>
        <label>品詞
          <select v-if="wordClasses.length" v-model="meaning.partOfSpeech">
            <option value="">未指定</option>
            <option v-for="wordClass in wordClasses" :key="wordClass.id" :value="wordClass.title">
              {{ wordClass.title }}
            </option>
            <option v-if="meaning.partOfSpeech && !wordClasses.some(entry => entry.title === meaning.partOfSpeech)"
              :value="meaning.partOfSpeech">{{ meaning.partOfSpeech }}（旧値）</option>
          </select>
          <input v-else v-model="meaning.partOfSpeech" type="text" maxlength="80" placeholder="名詞・動詞など" />
        </label>
        <label>意味・説明
          <textarea v-model="meaning.definition" maxlength="2000" rows="3" />
        </label>
        <h4>この意味の語源</h4>
        <div v-for="origin in meaning.etymologies" :key="origin.id" class="word-origin">
          <label>参照する言語
            <select v-model="origin.languageId" @change="origin.wordId = undefined">
              <option value="">参照なし</option>
              <option v-for="language in languages" :key="language.id" :value="language.id">{{ language.title }}</option>
            </select>
          </label>
          <label>参照する単語
            <select v-model="origin.wordId" :disabled="!origin.languageId">
              <option value="">参照なし</option>
              <option v-for="word in wordsOf(origin)" :key="word.id" :value="word.id">{{ word.title }}</option>
            </select>
          </label>
          <label>語源の説明
            <textarea v-model="origin.note" maxlength="1000" rows="2" />
          </label>
          <button type="button" class="inline-action" @click="removeOrigin(meaning, origin)">語源を削除</button>
        </div>
        <button type="button" class="inline-action" :disabled="meaning.etymologies.length >= 12" @click="addOrigin(meaning)">
          語源を追加
        </button>
      </section>
      <button type="button" class="inline-action" :disabled="meanings.length >= 30" @click="addMeaning">
        意味を追加
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
