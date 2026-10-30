<script setup lang="ts">
import type { ReaderKind, ReaderNode } from '~/types/reader';
import { parseTipTags } from '@eternalia/contracts';
const { t } = useUiLocale();

const route = useRoute();
const seriesId = computed(() => String(route.params.id));
const { data: tree, pending, error, refresh } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(seriesId.value) + '/tree',
);
const series = computed(() => tree.value?.find(
  node => node.kind === 'series' && node.id === seriesId.value,
));
const search = ref('');
const selectedCategory = ref('');
const selectedTag = ref('');
function tagsFor(tip: ReaderNode): string[] {
  try { return parseTipTags(tip.content.details.tags ?? '[]'); }
  catch { return []; }
}
const allTags = computed(() => [...new Set((tree.value ?? [])
  .filter(node => node.kind === 'tip')
  .flatMap(node => tagsFor(node)))].sort((a,b) => a.localeCompare(b,'ja')));
const normalizedQuery = computed(() => search.value.trim().toLocaleLowerCase());
function children(parentId: string, kind: ReaderKind): ReaderNode[] {
  return (tree.value ?? [])
    .filter(node => node.parentId === parentId && node.kind === kind)
    .sort((a, b) => a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja'));
}
const categories = computed(() => children(seriesId.value, 'category'));
const groups = computed(() => categories.value
  .filter(category => !selectedCategory.value || category.id === selectedCategory.value)
  .map(category => {
    const tips = children(category.id, 'tip').filter(tip => {
      const tags = tagsFor(tip);
      if (selectedTag.value && !tags.includes(selectedTag.value)) return false;
      if (!normalizedQuery.value) return true;
      const sections = children(tip.id, 'tipSection');
      return [category.content.title, tip.content.title, tip.content.body, ...tags,
        ...sections.map(section => section.content.title)]
        .some(value => value.toLocaleLowerCase().includes(normalizedQuery.value));
    });
    return { category, tips };
  })
  .filter(group => group.tips.length > 0 || !normalizedQuery.value));
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: t('home'), to: '/' },
      { label: t('tips'), to: '/tips' },
      { label: series?.content.title ?? 'シリーズ' },
    ]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="pending" label="設定集を読み込んでいます。" />
      <div v-else-if="error || !series" role="alert">
        <h1>設定集を表示できません</h1>
        <p class="error-text">シリーズが存在しないか、公開されていません。</p>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else>
        <h1>{{ series.content.title }} — 設定集</h1>
        <div class="tip-filters">
          <label>
            設定を検索
            <input v-model="search" type="search" placeholder="名称・概要・項目名" />
          </label>
          <label>
            カテゴリ
            <select v-model="selectedCategory">
              <option value="">すべてのカテゴリ</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.content.title }}
              </option>
            </select>
          </label>
          <label>タグ
            <select v-model="selectedTag">
              <option value="">すべてのタグ</option>
              <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </label>
        </div>
        <p v-if="!categories.length">現在公開中のカテゴリはありません。</p>
        <p v-else-if="!groups.length">条件に一致する公開設定はありません。</p>
        <section v-for="group in groups" :key="group.category.id" class="tip-category">
          <h2 class="section-heading">{{ group.category.content.title }}</h2>
          <p v-if="group.category.content.body" class="tip-description">{{ group.category.content.body }}</p>
          <p v-if="!group.tips.length" class="note">このカテゴリに公開中の設定はありません。</p>
          <article v-for="tip in group.tips" :key="tip.id" class="tip-entry">
            <h3><NuxtLink :to="'/items/' + tip.id">{{ tip.content.title }}</NuxtLink></h3>
            <p v-if="tip.content.body" class="tip-description">{{ tip.content.body }}</p>
            <ul v-if="tagsFor(tip).length" class="tip-tag-list" :aria-label="tip.content.title + 'のタグ'">
              <li v-for="tag in tagsFor(tip)" :key="tag">{{ tag }}</li>
            </ul>
            <dl v-if="children(tip.id, 'tipSection').length" class="tip-sections">
              <div v-for="section in children(tip.id, 'tipSection')" :key="section.id">
                <dt>{{ section.content.title }}</dt>
                <dd>{{ section.content.body }}</dd>
              </div>
            </dl>
          </article>
        </section>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.tip-filters { display:flex;flex-wrap:wrap;gap:1rem;margin:1.25rem 0; }
.tip-filters label { flex:1 1 12rem;min-width:0; }
.tip-filters input,.tip-filters select {
  display:block;width:100%;margin-top:.4rem;padding:.55rem;
  color:var(--color-text-base);background:var(--color-background-input);
  border:1px solid var(--color-border-base);border-radius:var(--radius-input);
}
.tip-category { margin-block:1.5rem 2rem; }
.tip-entry { border-top:1px solid var(--color-border-base);padding:1rem 0; }
.tip-entry h3 { margin:.15rem 0 .75rem; }
.tip-tag-list { list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.45rem; }
.tip-tag-list li { border:1px solid var(--color-border-base);border-radius:var(--radius-input);padding:.15rem .55rem; }
.tip-description,.tip-sections dd { white-space:pre-wrap;overflow-wrap:anywhere; }
.tip-sections { margin:1rem 0 0; }
.tip-sections > div { margin-block:.75rem; }
.tip-sections dt { font-weight:700; }
.tip-sections dd { margin:.3rem 0 0; }
</style>
