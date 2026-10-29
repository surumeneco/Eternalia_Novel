<script setup lang="ts">
import type { ReaderNode, ReaderKind } from '~/types/reader';

const { t } = useUiLocale();
const route = useRoute();
const id = computed(() => String(route.params.id));
const sections = {
  stories: { label: t('stories'), kinds: ['volume', 'part', 'chapter'] },
  tips: { label: t('tips'), kinds: ['category', 'tip', 'tipSection'] },
  dictionaries: { label: t('dictionaries'), kinds: ['language', 'word', 'grammar'] },
  timeline: { label: t('timeline'), kinds: ['periodization', 'event'] },
} satisfies Record<string, { label: string; kinds: ReaderKind[] }>;
type SectionKey = keyof typeof sections;
const section = computed<SectionKey | null>(() => {
  const value = route.query.section;
  return typeof value === 'string' && Object.hasOwn(sections, value) ? value as SectionKey : null;
});
const { data: tree, pending, error, refresh } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(id.value) + '/tree',
);
const series = computed(() => tree.value?.find(node => node.kind === 'series'));
const allowed = computed(() => section.value ? new Set<ReaderKind>(sections[section.value].kinds) : null);
const visible = computed(() => (tree.value ?? []).filter(node =>
  node.kind !== 'series' && (!allowed.value || allowed.value.has(node.kind))
));
const byId = computed(() => new Map((tree.value ?? []).map(node => [node.id, node])));
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
const labels: Record<ReaderKind, string> = {
  series: 'シリーズ', volume: '編', part: '部', chapter: '章',
  category: 'カテゴリ', tip: '設定', tipSection: '設定項目',
  language: '言語', word: '単語', grammar: '文法',
  periodization: '年代区分', event: '出来事',
};
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: t('home'), to: '/' },
      ...(section ? [{ label: sections[section].label, to: '/' + section }] : []),
      { label: series?.content.title || 'シリーズ' }
    ]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" label="シリーズを読み込んでいます。" />
      <div v-else-if="error" role="alert">
        <h1>シリーズを表示できません</h1>
        <p class="error-text">存在しないか、現在公開されていない可能性があります。</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else-if="series">
        <h1>{{ series.content.title }}</h1>
        <p v-if="series.content.body" class="reader-prose">{{ series.content.body }}</p>
        <nav v-if="!section" class="series-areas" aria-label="シリーズ内の資料">
          <NuxtLink :to="'/stories/' + id">ストーリーの目次</NuxtLink>
          <NuxtLink :to="'/tips/' + id">{{ t('tips') }}</NuxtLink>
          <NuxtLink :to="'/dictionaries/' + id">{{ t('dictionaries') }}</NuxtLink>
          <NuxtLink :to="'/timeline/' + id">{{ t('timeline') }}</NuxtLink>
        </nav>
        <h2 class="section-heading">{{ section ? sections[section].label : '公開コンテンツ' }}</h2>
        <ul v-if="visible.length" class="reader-list">
          <li v-for="node in visible" :key="node.id">
            <NuxtLink :to="itemLink(node)" :style="{ paddingInlineStart: (16 + depth(node) * 16) + 'px' }">
              <small class="note">{{ labels[node.kind] }}</small> {{ node.content.title }}
            </NuxtLink>
          </li>
        </ul>
        <p v-else>この領域には現在公開中の項目がありません。</p>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.reader-prose { white-space: pre-wrap; overflow-wrap: anywhere; }
.series-areas {display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0 1.5rem;}
.series-areas a {padding:.35rem .65rem;border:1px solid var(--color-border-base);background:var(--color-background-soft);}
</style>
