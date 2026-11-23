<script setup lang="ts">
import type { ReaderNode } from '~/types/reader';
const {t}=useUiLocale();
const route=useRoute();
const id=computed(()=>String(route.params.id));
const {data:tree,pending,error,refresh,clear}=await useFetch<ReaderNode[]>(
  ()=>'/api/public/series/'+encodeURIComponent(id.value)+'/tree');
const {revalidating}=usePublicReaderRevalidation([{clear,refresh}]);
const series=computed(()=>tree.value?.find(n=>n.kind==='series'&&n.id===id.value));
const areas=computed(()=>[
  {label:t('stories'),to:'/series/'+id.value+'/stories'},
  {label:t('tips'),to:'/series/'+id.value+'/settings'},
  {label:t('dictionaries'),to:'/series/'+id.value+'/dictionaries'},
  {label:t('timeline'),to:'/series/'+id.value+'/timeline'},
]);
</script>
<template>
  <div><TopicPath :items="[{label:t('home'),to:'/'},{label:series?.content.title??t('readerKindSeries')}]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="revalidating||pending" :label="t('readerLoadingSeries')" />
      <div v-else-if="error||!series" role="alert"><h1>{{ t('readerErrorNotPublic') }}</h1>
        <button class="inline-action" type="button" @click="refresh()">{{ t('retry') }}</button></div>
      <template v-else><h1>{{ series.content.title }}</h1><AuthorEditLink :item-id="series.id" item-kind="series" :series-id="id" />
        <RichContent v-if="series.content.body" :source="series.content.body" />
        <nav class="series-areas" :aria-label="t('readerSeriesAreas')">
          <NuxtLink v-for="area in areas" :key="area.to" :to="area.to">{{ area.label }}</NuxtLink>
        </nav>
      </template>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.series-areas { display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1rem;margin-top:1rem; }
.series-areas a {padding:1rem;background:var(--color-background-soft);border:1px solid var(--color-border-base); }
</style>
