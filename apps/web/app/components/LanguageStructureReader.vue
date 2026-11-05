<script setup lang="ts">
import type { LanguageCharacter, LanguageWordClass } from '@eternalia/contracts';

const props = defineProps<{ characters?: string; wordClasses?: string }>();
function readArray<T>(raw: string | undefined): T[] {
  if (!raw) return [];
  try {
    const decoded: unknown = JSON.parse(raw);
    return Array.isArray(decoded) ? decoded as T[] : [];
  } catch { return []; }
}
const symbols = computed(() => readArray<LanguageCharacter>(props.characters));
const classes = computed(() => readArray<LanguageWordClass>(props.wordClasses));
const names = computed(() => new Map(symbols.value.map(symbol => [symbol.id, symbol.glyph])));
function nextSymbols(symbol: LanguageCharacter): string {
  return symbol.nextIds.map(id => names.value.get(id)).filter((name): name is string => !!name).join('・');
}
</script>

<template>
  <div class="language-profile">
    <section v-if="symbols.length">
      <h2>文字・音韻</h2>
      <div class="language-table-wrap">
        <table class="language-table">
          <thead>
            <tr><th scope="col">文字</th><th scope="col">発音</th><th scope="col">語頭</th><th scope="col">語末</th><th scope="col">後続可能な文字</th></tr>
          </thead>
          <tbody>
            <tr v-for="symbol in symbols" :key="symbol.id">
              <th scope="row">{{ symbol.glyph }}</th>
              <td>{{ symbol.pronunciation || '—' }}</td>
              <td>{{ symbol.canStart ? '可' : '不可' }}</td>
              <td>{{ symbol.canEnd ? '可' : '不可' }}</td>
              <td>{{ nextSymbols(symbol) || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section v-if="classes.length">
      <h2>品詞</h2>
      <dl class="language-classes">
        <div v-for="entry in classes" :key="entry.id">
          <dt>{{ entry.name }}</dt>
          <dd>{{ entry.description }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.language-profile section { margin:1.5rem 0; }
.language-table-wrap { width:100%;overflow-x:auto; }
.language-table { border-collapse:collapse;min-width:35rem;width:100%; }
.language-table th,.language-table td { padding:.55rem .7rem;text-align:start;border-bottom:1px solid var(--color-border-base);vertical-align:top; }
.language-classes > div { margin:0 0 1rem; }
.language-classes dt { font-weight:700; }
.language-classes dd { white-space:pre-wrap;margin:.2rem 0;overflow-wrap:anywhere; }
</style>
