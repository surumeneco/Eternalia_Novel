<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import { parseTipTagIds, parseTipRelationIds } from '@eternalia/contracts';
const { t, language } = useUiLocale();

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
interface TagMaster { id: string; group: string; name: string; order: number; }
const tagCatalog = ref<TagMaster[]>([]);
const tagLoadError = ref(false);
const selectedTagId = ref('');
const text = (ja: string, en: string) => language.value === 'en' ? en : ja;
async function refreshTagCatalog() {
  try {
    tagCatalog.value = await $fetch<TagMaster[]>('/api/admin/masters/tags');
    tagLoadError.value = false;
  } catch { tagLoadError.value = true; }
}
onMounted(refreshTagCatalog);
const selectedRelatedId = ref('');
const byId = computed(() => new Map(props.nodes.map(node => [node.id, node])));
function parseOrEmpty<T>(raw: string, parse: (raw: string) => T[]): T[] {
  try { return parse(raw); } catch { return []; }
}
const tagIds = computed(() => parseOrEmpty(props.tags || '[]', parseTipTagIds));
const catalogById = computed(() => new Map(tagCatalog.value.map(tag => [tag.id, tag])));
const availableTags = computed(() => tagCatalog.value.filter(tag => !tagIds.value.includes(tag.id)));
function changeTags(ids: string[]) { emit('update:tags', JSON.stringify(ids)); }
function addTag() {
  if (!selectedTagId.value || !availableTags.value.some(tag => tag.id === selectedTagId.value)) return;
  changeTags([...tagIds.value, selectedTagId.value]);
  selectedTagId.value = '';
}
function removeTag(id: string) { changeTags(tagIds.value.filter(value => value !== id)); }
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
watch(() => props.selectedId, () => { selectedRelatedId.value = ''; selectedTagId.value = ''; });
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
  <section class="tip-links-editor" :aria-label="t('tipLinksAria')">
    <h3>{{ t('tipTags') }}</h3>
    <div class="tag-add">
      <label>{{ text('タグを選択', 'Choose a tag') }}
        <select v-model="selectedTagId" :aria-label="text('タグを選択', 'Choose a tag')">
          <option value="">{{ t('tipSelect') }}</option>
          <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
            {{ tag.group }} / {{ tag.name }}
          </option>
        </select>
      </label>
      <button class="inline-action" type="button" :disabled="!selectedTagId" @click="addTag">
        {{ text('タグを追加', 'Add tag') }}
      </button>
      <button class="inline-action" type="button" @click="refreshTagCatalog">
        {{ t('studioReload') }}
      </button>
    </div>
    <p v-if="tagLoadError" role="alert" class="error-text">
      {{ text('タグマスタを取得できません。', 'Could not load tag catalog.') }}
    </p>
    <p class="note">
      {{ text('タグは共通マスタから選択します。未登録なら', 'Choose tags from the shared catalog. For new tags, open') }}
      <NuxtLink to="/admin/masters/tags">{{ t('tagMaster') }}</NuxtLink>
    </p>
    <ul v-if="tagIds.length" class="tag-list">
      <li v-for="id in tagIds" :key="id">
        <span>{{ catalogById.get(id)?.name ?? id }}</span>
        <button type="button" class="inline-action"
          :aria-label="(catalogById.get(id)?.name ?? id) + t('tipRemoveSuffix')"
          @click="removeTag(id)">{{ t('tipRemove') }}</button>
      </li>
    </ul>
    <h3>{{ t('tipRelated') }}</h3>
    <div class="related-add">
      <label>{{ t('tipSameSeries') }}
        <select v-model="selectedRelatedId">
          <option value="">{{ t('tipSelect') }}</option>
          <option v-for="node in choices" :key="node.id" :value="node.id">{{ node.draft.title }}</option>
        </select>
      </label>
      <button class="inline-action" type="button" :disabled="!selectedRelatedId" @click="addRelated">{{ t('tipAddRelated') }}</button>
    </div>
    <p v-if="!relatedNodes.length" class="note">{{ t('tipNoRelated') }}</p>
    <ol v-else class="related-list">
      <li v-for="(node, index) in relatedNodes" :key="node.id">
        <span>{{ node.draft.title }}</span>
        <div class="action-row">
          <button class="inline-action" type="button" :disabled="index === 0" :aria-label="node.draft.title + t('tipUpSuffix')" @click="moveRelated(index, -1)">↑</button>
          <button class="inline-action" type="button" :disabled="index === relatedNodes.length - 1" :aria-label="node.draft.title + t('tipDownSuffix')" @click="moveRelated(index, 1)">↓</button>
          <button class="inline-action" type="button" :aria-label="node.draft.title + t('tipRemoveSuffix')" @click="removeRelated(node.id)">{{ t('tipRemove') }}</button>
        </div>
      </li>
    </ol>
    <p class="note">{{ t('tipPrivacyNote') }}</p>
  </section>
</template>

<style scoped>
.tip-links-editor { border:1px solid var(--color-border-base);border-radius:var(--radius-panel);padding:1rem;margin:1rem 0; }
.tip-links-editor label { display:block;flex:1;min-width:0; }
.tip-links-editor input,.tip-links-editor select { display:block;width:100%;margin-top:.35rem; }
.tag-add,.related-add { display:flex;align-items:end;gap:.5rem;flex-wrap:wrap; }
.tag-list{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.5rem;}
.tag-list li{display:flex;align-items:center;gap:.35rem;}
.related-list { padding-inline-start:1.5rem; }
.related-list li { margin-block:.6rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap; }
.action-row { display:flex;gap:.25rem; }
</style>
