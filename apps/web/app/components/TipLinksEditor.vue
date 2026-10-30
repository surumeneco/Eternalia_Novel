<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import { parseTipTags, parseTipRelationIds } from '@eternalia/contracts';

const props = defineProps<{
  selectedId: string;
  nodes: AuthorNode[];
  tags: string;
  relatedTipIds: string;
}>();
const emit = defineEmits<{
  'update:tags': [value: string];
  'update:relatedTipIds': [value: string];
}>();
const tagText = ref('');
const selectedRelatedId = ref('');
const byId = computed(() => new Map(props.nodes.map(node => [node.id, node])));
function parseOrEmpty<T>(raw: string, parse: (raw: string) => T[]): T[] {
  try { return parse(raw); } catch { return []; }
}
const relationIds = computed(() => parseOrEmpty(props.relatedTipIds || '[]', parseTipRelationIds));
const relatedNodes = computed(() => relationIds.value
  .map(id => byId.value.get(id))
  .filter((node): node is AuthorNode => !!node));
const seriesId = computed(() => {
  let node = byId.value.get(props.selectedId);
  const seen = new Set<string>();
  while (node && !seen.has(node.id)) {
    if (node.kind === 'series') return node.id;
    seen.add(node.id);
    node = node.parentId ? byId.value.get(node.parentId) : undefined;
  }
  return '';
});
function belongsToSeries(node: AuthorNode): boolean {
  const seen = new Set<string>();
  let current: AuthorNode | undefined = node;
  while (current && !seen.has(current.id)) {
    if (current.kind === 'series') return current.id === seriesId.value;
    seen.add(current.id);
    current = current.parentId ? byId.value.get(current.parentId) : undefined;
  }
  return false;
}
const choices = computed(() => props.nodes
  .filter(node => node.kind === 'tip' && node.id !== props.selectedId &&
    !relationIds.value.includes(node.id) && belongsToSeries(node))
  .sort((a, b) => a.draft.title.localeCompare(b.draft.title, 'ja')));
watch(() => [props.selectedId, props.tags], () => {
  tagText.value = parseOrEmpty(props.tags || '[]', parseTipTags).join(', ');
}, { immediate: true });
watch(() => props.selectedId, () => { selectedRelatedId.value = ''; });
function updateTags() {
  emit('update:tags', JSON.stringify(tagText.value.split(',').map(tag => tag.trim()).filter(Boolean)));
}
function changeRelations(ids: string[]) {
  emit('update:relatedTipIds', JSON.stringify(ids));
}
function addRelated() {
  if (!selectedRelatedId.value || !choices.value.some(node => node.id === selectedRelatedId.value)) return;
  changeRelations([...relationIds.value, selectedRelatedId.value]);
  selectedRelatedId.value = '';
}
function moveRelated(index: number, direction: -1 | 1) {
  const next = [...relationIds.value];
  const other = index + direction;
  if (other < 0 || other >= next.length) return;
  [next[index], next[other]] = [next[other]!, next[index]!];
  changeRelations(next);
}
function removeRelated(id: string) {
  changeRelations(relationIds.value.filter(item => item !== id));
}
</script>

<template>
  <section class="tip-links-editor" aria-label="設定のタグと関連">
    <h3>タグ</h3>
    <label>タグ名（カンマ区切り）
      <input v-model="tagText" type="text" maxlength="1600" placeholder="人物, 地名" @change="updateTags" @blur="updateTags" />
    </label>
    <p class="note">カテゴリとは独立した分類です。入力を確定してから下書きを保存してください。</p>
    <h3>関連する設定</h3>
    <div class="related-add">
      <label>同じシリーズの設定
        <select v-model="selectedRelatedId">
          <option value="">選択してください</option>
          <option v-for="node in choices" :key="node.id" :value="node.id">{{ node.draft.title }}</option>
        </select>
      </label>
      <button class="inline-action" type="button" :disabled="!selectedRelatedId" @click="addRelated">関連に追加</button>
    </div>
    <p v-if="!relatedNodes.length" class="note">関連設定はありません。</p>
    <ol v-else class="related-list">
      <li v-for="(node, index) in relatedNodes" :key="node.id">
        <span>{{ node.draft.title }}</span>
        <div class="action-row">
          <button class="inline-action" type="button" :disabled="index === 0" :aria-label="node.draft.title + 'を上へ'" @click="moveRelated(index, -1)">↑</button>
          <button class="inline-action" type="button" :disabled="index === relatedNodes.length - 1" :aria-label="node.draft.title + 'を下へ'" @click="moveRelated(index, 1)">↓</button>
          <button class="inline-action" type="button" :aria-label="node.draft.title + 'を削除'" @click="removeRelated(node.id)">解除</button>
        </div>
      </li>
    </ol>
    <p class="note">関連先の公開可否を確認し、読者には実効公開中の設定だけ表示します。</p>
  </section>
</template>

<style scoped>
.tip-links-editor { border:1px solid var(--color-border-base);border-radius:var(--radius-panel);padding:1rem;margin:1rem 0; }
.tip-links-editor label { display:block;flex:1;min-width:0; }
.tip-links-editor input,.tip-links-editor select { display:block;width:100%;margin-top:.35rem; }
.related-add { display:flex;align-items:end;gap:.5rem;flex-wrap:wrap; }
.related-list { padding-inline-start:1.5rem; }
.related-list li { margin-block:.6rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap; }
.action-row { display:flex;gap:.25rem; }
</style>
