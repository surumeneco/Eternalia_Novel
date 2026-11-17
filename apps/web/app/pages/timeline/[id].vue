<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const { t } = useUiLocale();
import { compareEventsWithinPeriod, commonTimelineYear, compareUnifiedTimelineEntries } from '@eternalia/contracts';

const route = useRoute();
const seriesId = computed(() => String(route.params.id));
const { data: tree, pending, error, refresh, clear } = await useFetch<ReaderNode[]>(
  () => '/api/public/series/' + encodeURIComponent(seriesId.value) + '/tree',
);
const { revalidating } = usePublicReaderRevalidation([{ clear, refresh }]);
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

/** Build the unified public timeline solely from the already-filtered public
 * tree (never from drafts or private/scheduled ancestors). */
const merged = computed(() => {
  const dated: { period: ReaderNode; event: ReaderNode; commonYear: number }[] = [];
  const unplaced: { period: ReaderNode; events: ReaderNode[] }[] = [];
  for (const period of periods.value) {
    const other: ReaderNode[] = [];
    for (const event of eventsOf(period)) {
      const year = commonTimelineYear(period.content.details.relativeYears, event.content.details.year);
      if (year === null) other.push(event);
      else dated.push({ period, event, commonYear: year });
    }
    if (other.length) unplaced.push({ period, events: other });
  }
  return { dated: dated.sort(compareUnifiedTimelineEntries), unplaced };
});
</script>

<template>
  <div>
    <TopicPath v-if="!revalidating" :items="[
      { label: t('home'), to: '/' },
      { label: series?.content.title ?? t('readerKindSeries'), to: '/series/' + seriesId },
      { label: t('timeline') },
    ]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="revalidating || pending" :label="t('readerLoadingTimeline')" />
      <div v-else-if="error || !series" role="alert">
        <h1>{{ t('readerErrorTimeline') }}</h1>
        <p class="error-text">{{ t('readerSeriesUnavailable') }}</p>
        <button type="button" class="inline-action" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else>
        <h1>{{ series.content.title }} — {{ t('timeline') }}</h1>
        <label class="period-filter">{{ t('readerPeriodFilter') }}
          <select v-model="periodId">
            <option value="">{{ t('readerAllPeriods') }}</option>
            <option v-for="period in periods" :key="period.id" :value="period.id">
              {{ period.content.title }}
            </option>
          </select>
        </label>
        <p v-if="!periods.length">{{ t('readerNoPeriods') }}</p>
        <template v-if="!periodId">
          <section v-if="merged.dated.length" class="timeline-merged">
            <h2 class="section-heading">{{ t('readerUnifiedTimeline') }}</h2>
            <ol class="event-list unified-event-list">
              <li v-for="entry in merged.dated" :key="entry.event.id">
                <span class="note event-year">
                  {{ t('readerCommonYear') }} {{ entry.commonYear }} · {{ entry.period.content.title }}
                  ({{ t('readerRelativeYear') }} {{ entry.event.content.details.year }})
                </span>
                <NuxtLink :to="'/items/' + entry.event.id">{{ entry.event.content.title }}</NuxtLink>
                <p v-if="entry.event.content.body" class="event-description">{{ entry.event.content.body }}</p>
              </li>
            </ol>
          </section>
          <section v-if="merged.unplaced.length" class="timeline-unplaced">
            <h2 class="section-heading">{{ t('readerUnplacedTimeline') }}</h2>
            <section v-for="group in merged.unplaced" :key="group.period.id" class="period-group">
              <h3 class="section-heading">
                <NuxtLink :to="'/items/' + group.period.id">{{ group.period.content.title }}</NuxtLink>
              </h3>
              <ol class="event-list">
                <li v-for="event in group.events" :key="event.id">
                  <span v-if="event.content.details.year" class="note event-year">
                    {{ t('readerRelativeYear') }} {{ event.content.details.year }}
                  </span>
                  <NuxtLink :to="'/items/' + event.id">{{ event.content.title }}</NuxtLink>
                  <p v-if="event.content.body" class="event-description">{{ event.content.body }}</p>
                </li>
              </ol>
            </section>
          </section>
        </template>
        <section v-for="period in (periodId ? visiblePeriods : [])" :key="period.id" class="period-group">
          <h2 class="section-heading">
            <NuxtLink :to="'/items/' + period.id">{{ period.content.title }}</NuxtLink>
          </h2>
          <p v-if="period.content.body" class="event-description">{{ period.content.body }}</p>
          <ol v-if="eventsOf(period).length" class="event-list">
            <li v-for="event in eventsOf(period)" :key="event.id">
              <span v-if="event.content.details.year" class="note event-year">
                {{ t('readerRelativeYear') }} {{ event.content.details.year }}
              </span>
              <NuxtLink :to="'/items/' + event.id">{{ event.content.title }}</NuxtLink>
              <p v-if="event.content.body" class="event-description">{{ event.content.body }}</p>
            </li>
          </ol>
          <p v-else class="note">{{ t('readerNoEventsInPeriod') }}</p>
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
