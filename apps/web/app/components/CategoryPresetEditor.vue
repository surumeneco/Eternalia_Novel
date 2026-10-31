<script setup lang="ts">
const { t } = useUiLocale();
interface Preset { title: string; body: string }

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const rows = computed<Preset[] | null>(() => {
  try {
    const parsed: unknown = JSON.parse(props.modelValue || '[]');
    if (!Array.isArray(parsed) || parsed.length > 30 ||
      !parsed.every(item => item && typeof item === 'object' &&
        typeof item.title === 'string' && typeof item.body === 'string')) return null;
    return parsed as Preset[];
  } catch {
    return null;
  }
});
function commit(items: Preset[]) {
  emit('update:modelValue', JSON.stringify(items));
}
function add() {
  if (!rows.value || rows.value.length >= 30) return;
  commit([...rows.value, { title: '', body: '' }]);
}
function remove(index: number) {
  if (!rows.value) return;
  commit(rows.value.filter((_, i) => i !== index));
}
function move(index: number, direction: number) {
  if (!rows.value) return;
  const target = index + direction;
  if (target < 0 || target >= rows.value.length) return;
  const next = rows.value.map(row => ({ ...row }));
  [next[index], next[target]] = [next[target]!, next[index]!];
  commit(next);
}
function edit(index: number, field: keyof Preset, event: Event) {
  if (!rows.value) return;
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const next = rows.value.map(row => ({ ...row }));
  if (!next[index]) return;
  next[index][field] = target.value;
  commit(next);
}
</script>

<template>
  <fieldset class="presets-editor">
    <legend>{{ t('presetLegend') }}</legend>
    <p class="note">{{ t('presetNote') }}</p>
    <div v-if="rows === null">
      <p role="alert" class="error-text">{{ t('presetParseError') }}</p>
      <textarea :value="modelValue" rows="5" @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
    </div>
    <template v-else>
      <ol class="preset-list">
        <li v-for="(preset, index) in rows" :key="index" class="preset-item">
          <label>{{ t('presetName') }}
            <input :value="preset.title" maxlength="150" @input="edit(index, 'title', $event)" />
          </label>
          <label>{{ t('presetBody') }}
            <textarea :value="preset.body" rows="3" maxlength="10000" @input="edit(index, 'body', $event)" />
          </label>
          <div class="preset-actions">
            <button type="button" class="inline-action" :disabled="index === 0" @click="move(index, -1)">{{ t('orderUp') }}</button>
            <button type="button" class="inline-action" :disabled="index === rows.length - 1" @click="move(index, 1)">{{ t('orderDown') }}</button>
            <button type="button" class="inline-action" @click="remove(index)">{{ t('presetDelete') }}</button>
          </div>
        </li>
      </ol>
      <button type="button" class="inline-action" :disabled="rows.length >= 30" @click="add">{{ t('studioAddItem') }}</button>
    </template>
  </fieldset>
</template>

<style scoped>
.presets-editor { min-width:0;padding:.75rem;border:1px solid var(--color-border-base); }
.presets-editor legend { font-weight:700; }
.preset-list { padding:0;list-style:none; }
.preset-item { border-top:1px solid var(--color-border-base);padding:1rem 0; }
.preset-actions { display:flex;flex-wrap:wrap;gap:.5rem; }
label { display:block; }
input,textarea { display:block;width:100%;padding:.55rem;margin-top:.4rem;
  background:var(--color-background-input);color:var(--color-text-base);
  border:1px solid var(--color-border-base);border-radius:var(--radius-input);
}
</style>
