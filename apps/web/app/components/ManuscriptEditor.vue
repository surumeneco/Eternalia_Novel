<script setup lang="ts">
import { insertManuscriptMarkup, type ManuscriptInsertionKind } from '~/utils/manuscript-markup';

const props = withDefaults(defineProps<{
  modelValue: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}>(), { disabled: false, rows: 14, maxLength: 100000 });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const textarea = ref<HTMLTextAreaElement | null>(null);
const issue = ref('');
function insert(kind: ManuscriptInsertionKind) {
  const input = textarea.value;
  if (!input || props.disabled || input.isComposing) return;
  const result = insertManuscriptMarkup(input.value, input.selectionStart, input.selectionEnd, kind);
  if (!result) {
    issue.value = '複数行またはルビ記号を含む選択範囲にはルビを挿入できません。';
    return;
  }
  if (result.value.length > props.maxLength) {
    issue.value = '本文の文字数上限を超えるため挿入できません。';
    return;
  }
  issue.value = '';
  emit('update:modelValue', result.value);
  nextTick(() => {
    const current = textarea.value;
    if (!current) return;
    current.focus();
    current.setSelectionRange(result.selectionStart, result.selectionEnd);
  });
}
function onInput(event: Event) {
  issue.value = '';
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <div class="manuscript-editor">
    <div class="markup-toolbar" role="group" aria-label="本文の記法を挿入">
      <button type="button" class="inline-action" :disabled="disabled" @mousedown.prevent @click="insert('ruby')">
        ルビを付ける
      </button>
      <button type="button" class="inline-action" :disabled="disabled" @mousedown.prevent @click="insert('page')">
        ページ区切りを挿入
      </button>
    </div>
    <label>本文・説明
      <textarea ref="textarea" :value="modelValue" :rows="rows" :maxlength="maxLength"
        :disabled="disabled" placeholder="ページ区切り: [[page]] ／ ルビ: ｜漢字《かんじ》"
        @input="onInput" />
    </label>
    <p v-if="issue" class="error-text" role="alert">{{ issue }}</p>
    <p class="note">文字を選択してルビを挿入すると、読み仮名の入力位置が選択されます。通常の本文保存・公開操作は変更されません。</p>
  </div>
</template>

<style scoped>
.manuscript-editor { min-width: 0; }
.markup-toolbar { display:flex; flex-wrap:wrap; gap:.45rem; margin:.5rem 0; }
label { display:block; margin:1rem 0; font-weight:650; }
textarea { display:block; width:100%; min-height:6rem; resize:vertical; line-height:1.7; margin-top:.45rem;
  padding:.6rem .7rem; color:var(--color-text-base); background:var(--color-background-input);
  border:1px solid var(--color-border-base); border-radius:var(--radius-input); }
.note { margin:.5rem 0 1rem; }
</style>
