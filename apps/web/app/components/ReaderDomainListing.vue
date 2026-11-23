<script setup lang="ts">
import type { ReaderNode, ReaderKind } from '~/types/reader';
import { publicAreaRoute, publicNodeRoute, belongsToPublicSeries } from '~/utils/public-node-route';
const props=defineProps<{ seriesId:string; area:'stories'|'settings'|'dictionaries'; parentId?:string }>();
const { t }=useUiLocale();
const route=useRoute();
const { data:tree,pending,error,refresh,clear }=await useFetch<ReaderNode[]>(
  ()=>'/api/public/series/'+encodeURIComponent(props.seriesId)+'/tree');
const {revalidating}=usePublicReaderRevalidation([{clear,refresh}]);
const series=computed(()=>tree.value?.find(n=>n.kind==='series'&&n.id===props.seriesId));
const byId=computed(()=>new Map((tree.value??[]).map(n=>[n.id,n])));
const current=computed(()=>props.parentId?byId.value.get(props.parentId):series.value);
const expectedKind=computed<ReaderKind>(()=>props.area==='stories'?'volume':props.area==='settings'?'category':'language');
const valid=computed(()=>!!series.value&&(!props.parentId||!!current.value&&
  belongsToPublicSeries(tree.value??[],props.parentId,props.seriesId,
    props.area==='stories'?(current.value.kind==='volume'?'volume':'part'):expectedKind.value))&&
  (!props.parentId||props.area==='stories'||current.value?.kind===expectedKind.value)&&
  route.path===(!props.parentId?publicAreaRoute(props.seriesId,props.area):publicNodeRoute(tree.value??[],props.parentId)));
const childKind=computed<ReaderKind>(()=>!props.parentId?expectedKind.value:props.area==='stories'?
  current.value?.kind==='volume'?'part':'chapter':props.area==='settings'?'tip':'word');
const entries=computed(()=>(tree.value??[]).filter(n=>n.parentId===(props.parentId??props.seriesId)&&n.kind===childKind.value)
  .sort((a,b)=>props.area==='dictionaries'&&props.parentId?
    a.content.title.localeCompare(b.content.title):a.order-b.order||a.content.title.localeCompare(b.content.title,'ja')));
const query=ref('');const speech=ref('');
type PublicWordMeaning = { partOfSpeech?: string; definition?: string };
function wordMeanings(node: ReaderNode): PublicWordMeaning[] {
  if (node.kind !== 'word') return [];
  try {
    const value: unknown = JSON.parse(node.content.details.meanings ?? '[]');
    return Array.isArray(value) ? value.filter((entry): entry is PublicWordMeaning =>
      !!entry && typeof entry === 'object') : [];
  } catch { return []; }
}
function speechClasses(node: ReaderNode): string[] {
  return [...new Set(wordMeanings(node).map(meaning => meaning.partOfSpeech).filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ))];
}
const classes=computed(()=>[...new Set(entries.value.flatMap(speechClasses))].sort((a,b)=>a.localeCompare(b,'ja')));
const filtered=computed(()=>entries.value.filter(node=>
  (!speech.value||speechClasses(node).includes(speech.value))&&
  (!query.value||[node.content.title,node.content.body,...wordMeanings(node).map(meaning=>meaning.definition??'')]
    .some(text=>text.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())))));
const parentCrumbs=computed(()=>{
  const chain:{label:string;to?:string}[]=[];
  let cur=current.value;
  const seen=new Set<string>();
  while(cur&&!seen.has(cur.id)){
    seen.add(cur.id);
    chain.unshift({label:cur.content.title,to:publicNodeRoute(tree.value??[],cur.id)??undefined});
    cur=cur.parentId?byId.value.get(cur.parentId):undefined;
  }
  return chain;
});
const title=computed(()=>!props.parentId?(props.area==='stories'?t('stories'):props.area==='settings'?t('tips'):t('dictionaries')):current.value?.content.title??'');
const grammar=computed(()=>props.area==='dictionaries'&&props.parentId?
  (tree.value??[]).filter(n=>n.kind==='grammar'&&n.parentId===props.parentId):[]);
</script>
<template>
  <div>
    <TopicPath :items="[{label:t('home'),to:'/'},...parentCrumbs,
      {label:!parentId?(area==='stories'?t('stories'):area==='settings'?t('tips'):t('dictionaries')):childKind=== 'part'?t('readerKindPart'):childKind==='chapter'?t('chapter'):childKind==='tip'?t('tip'):t('word')}]" />
    <ReaderPanel>
      <ReadingSkeleton v-if="revalidating||pending" :label="t('loading')" />
      <div v-else-if="error||!valid" role="alert">
        <h1>{{ t('readerErrorNotPublic') }}</h1>
        <button type="button" class="inline-action" @click="refresh()">{{ t('retry') }}</button>
      </div>
      <template v-else>
        <h1>{{ title }}</h1>
        <AuthorEditLink v-if="current" :item-id="current.id" :item-kind="current.kind" :series-id="seriesId" />
        <RichContent v-if="parentId&&current?.content.body" :source="current.content.body" />
        <NuxtLink v-if="area==='dictionaries'&&parentId" :to="publicAreaRoute(seriesId,'dictionaries')+'/'+encodeURIComponent(parentId)+'/details'">
          {{ t('readerKindLanguage') }} — {{ t('readerDetails') }}
        </NuxtLink>
        <div v-if="area==='dictionaries'&&parentId" class="domain-filters">
          <label>{{ t('readerWordSearch') }}<input v-model="query" type="search" /></label>
          <label>{{ t('readerPartOfSpeechFilter') }}<select v-model="speech">
            <option value="">{{ t('readerAllPartsOfSpeech') }}</option>
            <option v-for="part in classes" :key="part" :value="part">{{ part }}</option>
          </select></label>
        </div>
        <ul v-if="filtered.length" class="reader-list domain-list">
          <li v-for="item in filtered" :key="item.id">
            <NuxtLink :to="publicNodeRoute(tree??[],item.id)??'#'">{{ item.content.title }}</NuxtLink>
            <p v-if="item.content.body" class="note">{{ item.content.body.slice(0,150) }}</p>
          </li>
        </ul>
        <p v-else class="note">{{ t('studioEmpty') }}</p>
        <section v-if="grammar.length">
          <h2 class="section-heading">{{ t('readerKindGrammar') }}</h2>
          <ul class="reader-list"><li v-for="g in grammar" :key="g.id">
            <NuxtLink :to="publicNodeRoute(tree??[],g.id)??'#'">{{ g.content.title }}</NuxtLink>
          </li></ul>
        </section>
      </template>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.domain-list { margin-top:1rem; }
.domain-list p { margin:.25rem .5rem 1rem;white-space:pre-wrap; }
.domain-filters { display:flex;flex-wrap:wrap;gap:1rem; }
.domain-filters label { flex:1 1 12rem; }
.domain-filters input,.domain-filters select { display:block;width:100%;padding:.5rem;background:var(--color-background-input);color:var(--color-text-base); }
</style>
