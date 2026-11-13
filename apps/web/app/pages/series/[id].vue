<script setup lang="ts">
import type { ReaderNode, ReaderKind } from '~/types/reader';

const { t } = useUiLocale();
const route = useRoute();
const id = computed(() => String(route.params.id));
type SectionKey = 'stories' | 'tips' | 'dictionaries' | 'timeline';
const sections = computed<Record<SectionKey,{label:string;kinds:ReaderKind[]}>>(() => ({
  stories: { label: t('stories'), kinds: ['volume','part','chapter'] },
  tips: { label: t('tips'), kinds: ['category','tip','tipSection'] },
  dictionaries: { label: t('dictionaries'), kinds: ['language','word','grammar'] },
  timeline: { label: t('timeline'), kinds: ['periodization','event'] },
}));
const section = computed<SectionKey | null>(() => {
  const value = route.query.section;
  return typeof value === 'string' && Object.hasOwn(sections.value, value) ? value as SectionKey : null;
});
const { data: tree, pending, error, refresh } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(id.value) + '/tree',
);
const series = computed(() => tree.value?.find(node => node.kind === 'series'));
const allowed = computed(() => section.value ? new Set<ReaderKind>(sections.value[section.value].kinds) : null);
const byId = computed(() => new Map((tree.value ?? []).map(node => [node.id, node])));
// Order is scoped to a parent AND a kind. Different kinds can share 0-based
// positions, so compare kind order before each node's position in the path.
const kindOrder: Record<ReaderKind, number> = {
  series: -1, volume: 0, part: 0, chapter: 0,
  category: 1, tip: 0, tipSection: 0,
  language: 2, word: 0, grammar: 1,
  periodization: 3, event: 0,
};
function position(node: ReaderNode): number[] {
  const sequence = [kindOrder[node.kind], node.order];
  const visited = new Set<string>([node.id]);
  let parentId = node.parentId;
  while (parentId && parentId !== id.value && !visited.has(parentId) && sequence.length < 24) {
    visited.add(parentId);
    const parent = byId.value.get(parentId);
    if (!parent) break;
    sequence.unshift(kindOrder[parent.kind], parent.order);
    parentId = parent.parentId;
  }
  return sequence;
}
const visible = computed(() => (tree.value ?? [])
  .filter(node => node.kind !== 'series' && (!allowed.value || allowed.value.has(node.kind)))
  .sort((a, b) => {
    const left = position(a);
    const right = position(b);
    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      if (left[i] !== right[i]) return left[i]! - right[i]!;
    }
    return left.length - right.length || a.content.title.localeCompare(b.content.title, 'ja');
  }));
function depth(node: ReaderNode): number {
  let d = 0;
  let parentId = node.parentId;
  const visited = new Set<string>();
  while (parentId && parentId !== id.value && !visited.has(parentId) && d < 8) {
    visited.add(parentId);
    const ancestor = byId.value.get(parentId);
    if (!ancestor) break;
    d++;
    parentId = ancestor.parentId;
  }
  return d;
}
function itemLink(node: ReaderNode) {
  return node.kind === 'chapter'
    ? { path: '/read/' + node.id, query: { series: id.value } }
    : '/items/' + node.id;
}
const labels = computed<Record<ReaderKind,string>>(() => ({
  series: t('readerKindSeries'), volume: t('readerKindVolume'),
  part: t('readerKindPart'), chapter: t('readerKindChapter'),
  category: t('readerKindCategory'), tip: t('readerKindTip'),
  tipSection: t('readerKindTipSection'), language: t('readerKindLanguage'),
  word: t('readerKindWord'), grammar: t('readerKindGrammar'),
  periodization: t('readerKindPeriodization'), event: t('readerKindEvent'),
}));
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: t('home'), to: '/' },
      ...(section ? [{ label: sections[section].label, to: '/' + section }] : []),
      { label: series?.content.title || t('readerKindSeries') }
    ]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" :label="t('readerLoadingSeries')" />
      <div v-else-if="error" role="alert">
        <h1>{{ t('readerErrorSeries') }}</h1>
        <p class="error-text">{{ t('readerErrorNotPublic') }}</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else-if="series">
        <h1>{{ series.content.title }}</h1>
        <AuthorEditLink :item-id="series.id" />
        <p v-if="series.content.body" class="reader-prose">{{ series.content.body }}</p>
        <nav v-if="!section" class="series-areas" :aria-label="t('readerSeriesAreas')">
          <NuxtLink :to="'/stories/' + id">{{ t('readerStoryToc') }}</NuxtLink>
          <NuxtLink :to="'/tips/' + id">{{ t('tips') }}</NuxtLink>
          <NuxtLink :to="'/dictionaries/' + id">{{ t('dictionaries') }}</NuxtLink>
          <NuxtLink :to="'/timeline/' + id">{{ t('timeline') }}</NuxtLink>
        </nav>
        <h2 class="section-heading">{{ section ? sections[section].label : t('readerPublishedContent') }}</h2>
        <ul v-if="visible.length" class="reader-list">
          <li v-for="node in visible" :key="node.id">
            <NuxtLink :to="itemLink(node)" :style="{ paddingInlineStart: (16 + depth(node) * 16) + 'px' }">
              <small class="note">{{ labels[node.kind] }}</small> {{ node.content.title }}
            </NuxtLink>
          </li>
        </ul>
        <p v-else>{{ t('readerNoPublicInSection') }}</p>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.reader-prose { white-space: pre-wrap; overflow-wrap: anywhere; }
.series-areas {display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0 1.5rem;}
.series-areas a {padding:.35rem .65rem;border:1px solid var(--color-border-base);background:var(--color-background-soft);}
</style>
