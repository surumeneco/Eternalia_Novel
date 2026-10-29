<script setup lang="ts">
import type { LanguageCharacter, LanguageWordClass } from '@eternalia/contracts';

const props = defineProps<{ characters: string; wordClasses: string }>();
const emit = defineEmits<{
  'update:characters': [value: string];
  'update:wordClasses': [value: string];
}>();
const symbols = ref<LanguageCharacter[]>([]);
const classes = ref<LanguageWordClass[]>([]);
const symbolsError = ref(false);
const classesError = ref(false);
watch(() => props.characters, raw => {
  try {
    const decoded: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(decoded)) throw new Error('not array');
    symbols.value = decoded as LanguageCharacter[];
    symbolsError.value = false;
  } catch { symbolsError.value = true; }
}, { immediate: true });
watch(() => props.wordClasses, raw => {
  try {
    const decoded: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(decoded)) throw new Error('not array');
    classes.value = decoded as LanguageWordClass[];
    classesError.value = false;
  } catch { classesError.value = true; }
}, { immediate: true });
watch(symbols, value => {
  if (!symbolsError.value) {
    const encoded = JSON.stringify(value);
    if (encoded !== props.characters) emit('update:characters', encoded);
  }
}, { deep: true });
watch(classes, value => {
  if (!classesError.value) {
    const encoded = JSON.stringify(value);
    if (encoded !== props.wordClasses) emit('update:wordClasses', encoded);
  }
}, { deep: true });
function addSymbol() {
  if (symbols.value.length >= 120 || symbolsError.value) return;
  symbols.value.push({
    id: crypto.randomUUID(), glyph: '', pronunciation: '', canStart: true, canEnd: true, nextIds: [],
  });
}
function removeSymbol(id: string) {
  symbols.value = symbols.value.filter(item => item.id !== id);
  for (const item of symbols.value) item.nextIds = item.nextIds.filter(value => value !== id);
}
function toggleFollowing(source: LanguageCharacter, nextId: string) {
  source.nextIds = source.nextIds.includes(nextId)
    ? source.nextIds.filter(id => id !== nextId) : [...source.nextIds, nextId];
}
function addClass() {
  if (classes.value.length >= 50 || classesError.value) return;
  classes.value.push({ id: crypto.randomUUID(), name: '', description: '' });
}
</script>

<template>
  <div class="language-structure">
    <fieldset>
      <legend>文字と発音</legend>
      <p class="note">各文字の発音、語頭・語末での許容、および後ろに置ける文字を登録します。</p>
      <p v-if="symbolsError" role="alert" class="error-text">文字データを解析できません。保存前に元データを確認してください。</p>
      <template v-else>
        <section v-for="(symbol, index) in symbols" :key="symbol.id" class="symbol-entry">
          <div class="entry-heading">
            <h3>文字 {{ index + 1 }}</h3>
            <button type="button" class="inline-action" @click="removeSymbol(symbol.id)">文字を削除</button>
          </div>
          <label>文字・表記<input v-model="symbol.glyph" maxlength="40" required /></label>
          <label>発音<input v-model="symbol.pronunciation" maxlength="100" /></label>
          <div class="flag-options">
            <label><input v-model="symbol.canStart" type="checkbox" /> 語頭に置ける</label>
            <label><input v-model="symbol.canEnd" type="checkbox" /> 語末に置ける</label>
          </div>
          <fieldset v-if="symbols.length" class="following">
            <legend>この文字の後に置ける文字</legend>
            <div class="following-grid">
              <label v-for="target in symbols" :key="target.id">
                <input type="checkbox" :checked="symbol.nextIds.includes(target.id)" @change="toggleFollowing(symbol, target.id)" />
                {{ target.glyph || '未入力の文字' }}
              </label>
            </div>
          </fieldset>
        </section>
        <button type="button" class="inline-action" :disabled="symbols.length >= 120" @click="addSymbol">
          文字を追加
        </button>
      </template>
    </fieldset>
    <fieldset>
      <legend>品詞マスタ</legend>
      <p v-if="classesError" role="alert" class="error-text">品詞データを解析できません。</p>
      <template v-else>
        <section v-for="(entry, index) in classes" :key="entry.id" class="symbol-entry">
          <div class="entry-heading">
            <h3>品詞 {{ index + 1 }}</h3>
            <button type="button" class="inline-action" @click="classes.splice(index, 1)">品詞を削除</button>
          </div>
          <label>品詞名<input v-model="entry.name" maxlength="80" required /></label>
          <label>説明<textarea v-model="entry.description" maxlength="2000" rows="2" /></label>
        </section>
        <button type="button" class="inline-action" :disabled="classes.length >= 50" @click="addClass">品詞を追加</button>
      </template>
    </fieldset>
  </div>
</template>

<style scoped>
.language-structure { min-width:0; }
.language-structure > fieldset { min-width:0;border:1px solid var(--color-border-base);border-radius:var(--radius-panel);padding:1rem;margin:1rem 0; }
.symbol-entry { padding:1rem 0;border-bottom:1px solid var(--color-border-base); }
.entry-heading { display:flex;align-items:center;justify-content:space-between;gap:1rem; }
.entry-heading h3 { margin:0; }
.flag-options,.following-grid { display:flex;flex-wrap:wrap;gap:.5rem 1rem; }
.flag-options label,.following-grid label { display:flex;gap:.35rem;align-items:center;margin:.4rem 0;font-weight:normal; }
.flag-options input,.following-grid input { width:auto;margin:0; }
.following { min-width:0;margin:.6rem 0;padding:.65rem;border:1px solid var(--color-border-base); }
</style>
