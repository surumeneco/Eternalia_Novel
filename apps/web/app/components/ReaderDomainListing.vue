<script setup lang="ts">
import type { ReaderNode, ReaderKind } from '~/types/reader';
import { parseTipTags } from '@eternalia/contracts';
import { compareDictionaryWordSpelling } from '~/utils/dictionary-order';
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
    compareDictionaryWordSpelling(a,b):a.order-b.order||a.content.title.localeCompare(b.content.title,'ja')));
const query=ref('');const speech=ref('');const selectedTag=ref('');const tipOrder=ref('manual');
watch(()=>[props.seriesId,props.area,props.parentId],()=>{query.value='';speech.value='';selectedTag.value='';tipOrder.value='manual';});
function tipTags(node:ReaderNode):string[]{
  try{return parseTipTags(node.content.details.tags??'[]');}catch{return [];}
}
const tags=computed(()=>[...new Set(entries.value.flatMap(tipTags))].sort((a,b)=>a.localeCompare(b,'ja')));
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
const filtered=computed(()=>{
  const q=query.value.trim().toLocaleLowerCase();
  const result=entries.value.filter(node=>{
    if(speech.value&&!speechClasses(node).includes(speech.value))return false;
    if(node.kind==='tip'){
      if(selectedTag.value&&!tipTags(node).includes(selectedTag.value))return false;
      const sections=(tree.value??[]).filter(n=>n.kind==='tipSection'&&n.parentId===node.id);
      return !q||[current.value?.content.title??'',node.content.title,node.content.body,...tipTags(node),
        ...sections.flatMap(n=>[n.content.title,n.content.body])].some(s=>s.toLocaleLowerCase().includes(q));
    }
    return !q||[node.content.title,node.content.body,...wordMeanings(node).map(m=>m.definition??'')]
      .some(s=>s.toLocaleLowerCase().includes(q));
  });
  if(childKind.value==='tip'){
    if(tipOrder.value==='title')result.sort((a,b)=>a.content.title.localeCompare(b.content.title,'ja')||a.id.localeCompare(b.id));
    if(tipOrder.value==='recent')result.sort((a,b)=>b.publishedAt-a.publishedAt||a.id.localeCompare(b.id));
  }
  return result;
});
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
const breadcrumbItems=computed(()=>{
  const areaLabel=props.area==='stories'?t('stories'):props.area==='settings'?t('tips'):t('dictionaries');
  const parents=parentCrumbs.value;
  return [
    {label:t('home'),to:'/'},
    ...parents.slice(0,1),
    {label:areaLabel,to:props.parentId?publicAreaRoute(props.seriesId,props.area):undefined},
    ...parents.slice(1).map((item,index,rest)=>({
      label:item.label,
      to:index===rest.length-1?undefined:item.to,
    })),
  ];
});
const title=computed(()=>!props.parentId?(props.area==='stories'?t('stories'):props.area==='settings'?t('tips'):t('dictionaries')):current.value?.content.title??'');
const grammar=computed(()=>props.area==='dictionaries'&&props.parentId?
  (tree.value??[]).filter(n=>n.kind==='grammar'&&n.parentId===props.parentId):[]);
</script>
<template>
  <div>
    <TopicPath :items="breadcrumbItems" />
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
        <div v-if="childKind==='tip'" class="domain-filters">
          <label>{{ t('readerTipSearch') }}<input v-model="query" type="search" :aria-label="t('readerTipSearch')" :placeholder="t('readerTipSearchPlaceholder')" /></label>
          <label>{{ t('readerTagFilter') }}<select v-model="selectedTag" :aria-label="t('readerTagFilter')">
            <option value="">{{ t('readerAllTags') }}</option>
            <option v-for="tag in tags" :key="tag" :value="tag">{{ tag }}</option>
          </select></label>
          <label>{{ t('readerSortFilter') }}<select v-model="tipOrder" :aria-label="t('readerSortFilter')">
            <option value="manual">{{ t('searchManual') }}</option>
            <option value="title">{{ t('searchTitleSort') }}</option>
            <option value="recent">{{ t('searchRecent') }}</option>
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
