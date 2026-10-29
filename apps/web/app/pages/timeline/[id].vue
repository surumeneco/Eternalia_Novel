<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
import { compareEventsWithinPeriod } from '@eternalia/contracts';

const route = useRoute();
const seriesId = computed(() => String(route.params.id));
const { data: tree, pending, error, refresh } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(seriesId.value) + '/tree',
);
const series = computed(() => tree.value?.find(node =>
  node.kind === 'series' && node.id === seriesId.value,
));
const periodId = ref('');
const periods = computed(() => (tree.value ?? [])
  .filter(node => node.kind === 'periodization' && node.parentId === seriesId.value)
  .sort((a, b) => a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja')));
const visiblePeriods = computed(() => periods.value.filter(
  period => !periodId.value || period.id === periodId.value,
));
function eventsOf(period: ReaderNode) {
  return (tree.value ?? [])
    .filter(node => node.kind === 'event' && node.parentId === period.id)
    .sort(compareEventsWithinPeriod);
}
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: 'ホーム', to: '/' },
      { label: '年表', to: '/timeline' },
      { label: series?.content.title ?? 'シリーズ' },
    ]" />
    <ReaderPanel>
      <p v-if="pending" role="status">年表を読み込んでいます。</p>
      <div v-else-if="error || !series" role="alert">
        <h1>年表を表示できません</h1>
        <p class="error-text">シリーズが存在しないか、公開されていません。</p>
        <button type="button" class="inline-action" @click="refresh()">再試行</button>
      </div>
      <template v-else>
        <h1>{{ series.content.title }} — 年表</h1>
        <label class="period-filter">年代区分
          <select v-model="periodId">
            <option value="">すべての年代区分</option>
            <option v-for="period in periods" :key="period.id" :value="period.id">
              {{ period.content.title }}
            </option>
          </select>
        </label>
        <p v-if="!periods.length">現在公開中の年代区分はありません。</p>
        <section v-for="period in visiblePeriods" :key="period.id" class="period-group">
          <h2 class="section-heading">
            <NuxtLink :to="'/items/' + period.id">{{ period.content.title }}</NuxtLink>
          </h2>
          <p v-if="period.content.body" class="event-description">{{ period.content.body }}</p>
          <ol v-if="eventsOf(period).length" class="event-list">
            <li v-for="event in eventsOf(period)" :key="event.id">
              <span v-if="event.content.details.year" class="note event-year">
                相対年 {{ event.content.details.year }}
              </span>
              <NuxtLink :to="'/items/' + event.id">{{ event.content.title }}</NuxtLink>
              <p v-if="event.content.body" class="event-description">{{ event.content.body }}</p>
            </li>
          </ol>
          <p v-else class="note">この年代区分に公開中の出来事はありません。</p>
        </section>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.period-filter { display:block;max-width:24rem;margin:1.25rem 0; }
.period-filter select {
  display:block;width:100%;margin-top:.4rem;padding:.55rem;
  color:var(--color-text-base);background:var(--color-background-input);
  border:1px solid var(--color-border-base);border-radius:var(--radius-input);
}
.period-group { margin-block:1.5rem 2rem; }
.event-list { list-style:none;padding:0;margin:1rem 0; }
.event-list li { border-top:1px solid var(--color-border-base);padding:1rem 0; }
.event-year { display:block;margin-bottom:.3rem; }
.event-description { white-space:pre-wrap;overflow-wrap:anywhere;margin:.5rem 0; }
</style>
