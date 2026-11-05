<script setup lang="ts">
import { parseTipTags } from '@eternalia/contracts';
const props = defineProps<{ tags?: string; relatedTips?: string }>();
const tags = computed(() => {
  try { return parseTipTags(props.tags || '[]'); } catch { return []; }
});
const related = computed(() => {
  let raw: unknown;
  try { raw = JSON.parse(props.relatedTips || '[]'); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is { id: string; title: string } =>
    !!value && typeof value.id === 'string' && typeof value.title === 'string');
});
</script>
<template>
  <div v-if="tags.length || related.length" class="tip-links">
    <section v-if="tags.length" aria-label="タグ">
      <h2>タグ</h2>
      <ul class="tag-list">
        <li v-for="tag in tags" :key="tag">{{ tag }}</li>
      </ul>
    </section>
    <section v-if="related.length" aria-label="関連する設定">
      <h2>関連する設定</h2>
      <ol>
        <li v-for="item in related" :key="item.id">
          <NuxtLink :to="'/items/' + encodeURIComponent(item.id)">{{ item.title }}</NuxtLink>
        </li>
      </ol>
    </section>
  </div>
</template>
<style scoped>
.tip-links { margin-block:1.5rem; }
.tip-links h2 { font-size:var(--font-size-l); }
.tag-list { list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.45rem; }
.tag-list li { border:1px solid var(--color-border-base);border-radius:var(--radius-input);padding:.2rem .65rem; }
</style>
