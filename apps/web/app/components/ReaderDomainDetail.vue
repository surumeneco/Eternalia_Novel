<script setup lang="ts">
import type { ReaderNode,ReaderKind } from '~/types/reader';
import { publicAreaRoute,publicNodeRoute } from '~/utils/public-node-route';
import { publishedChapterSequence } from '~/utils/chapter-navigation';
import { formatJstDisplay } from '~/utils/jst-publication-time';
const props=defineProps<{ seriesId:string; nodeId:string; kind:ReaderKind; languageDetails?:boolean }>();
const {t,language}=useUiLocale();
const route=useRoute();
const {data:tree,pending:treePending,error:treeError,refresh:refreshTree,clear:clearTree}=await useFetch<ReaderNode[]>(
  ()=>'/api/public/series/'+encodeURIComponent(props.seriesId)+'/tree');
const {data:item,pending,error,refresh,clear}=await useFetch<ReaderNode>(
  ()=>'/api/public/items/'+encodeURIComponent(props.nodeId));
const {revalidating}=usePublicReaderRevalidation([{clear,refresh},{clear:clearTree,refresh:refreshTree}]);
const valid=computed(()=>{
  const base=publicNodeRoute(tree.value??[],props.nodeId);
  const path=props.languageDetails&&base?base+'/details':base;
  return item.value?.kind===props.kind&&!!tree.value?.some(n=>n.id===props.nodeId&&n.kind===props.kind)&&path===route.path;
});
const byId=computed(()=>new Map((tree.value??[]).map(n=>[n.id,n])));
const crumbs=computed(()=>{
  const path:{label:string;to?:string}[]=[{label:t('home'),to:'/'}];
  const chain:ReaderNode[]=[];
  let node=byId.value.get(props.nodeId);
  while(node&&chain.length<7){chain.unshift(node);node=node.parentId?byId.value.get(node.parentId):undefined;}
  const area=props.kind==='chapter'?'stories':(['tip','tipSection','category'].includes(props.kind)?'settings':
    (['word','grammar','language'].includes(props.kind)?'dictionaries':'timeline'));
  const label=area==='stories'?t('stories'):area==='settings'?t('tips'):area==='dictionaries'?t('dictionaries'):t('timeline');
  for(const [i,n] of chain.entries()){
    if(i===0&&n.kind==='series'){
      path.push({label:n.content.title,to:publicNodeRoute(tree.value??[],n.id)??undefined});
      path.push({label,to:publicAreaRoute(props.seriesId,area)});
    }else{
      const isLast=i===chain.length-1&&!props.languageDetails;
      path.push({label:n.content.title,to:isLast?undefined:publicNodeRoute(tree.value??[],n.id)??undefined});
    }
  }
  if(props.languageDetails)path.push({label:t('readerDetails')});
  return path;
});
const displayDetails=computed(()=>Object.fromEntries(Object.entries(item.value?.content.details??{}).filter(([key])=>
  !(item.value?.kind==='tip'&&['tags','relatedTips'].includes(key))&&
  !(item.value?.kind==='word'&&key==='meanings')&&
  !(item.value?.kind==='language'&&['characters','wordClasses'].includes(key)))));
const sequence=computed(()=>props.kind==='chapter'?publishedChapterSequence(tree.value??[],props.seriesId):[]);
const index=computed(()=>sequence.value.findIndex(n=>n.id===props.nodeId));
const prev=computed(()=>index.value>0?sequence.value[index.value-1]:null);
const next=computed(()=>index.value>=0?sequence.value[index.value+1]??null:null);
const languageHome=computed(()=>{
  const node=byId.value.get(props.nodeId);
  const lang=node?.kind==='language'?node:node?.parentId?byId.value.get(node.parentId):null;
  return lang?.kind==='language'?publicNodeRoute(tree.value??[],lang.id):null;
});
</script>
<template>
  <div><TopicPath :items="crumbs" />
    <ReaderPanel>
      <ReadingSkeleton v-if="revalidating||pending||treePending" :label="t('loading')" />
      <div v-else-if="error||treeError||!valid" role="alert"><h1>{{ t('readerErrorNotPublic') }}</h1>
        <button type="button" class="inline-action" @click="refresh();refreshTree()">{{ t('retry') }}</button></div>
      <article v-else-if="item">
        <h1>{{ item.content.title }}</h1><AuthorEditLink :item-id="item.id" :item-kind="kind" :series-id="seriesId" />
        <p class="note">{{ t('readerPublishedUpdated') }}
          <time :datetime="new Date(item.publishedAt).toISOString()">{{ formatJstDisplay(item.publishedAt,language) }}</time>
        </p>
        <RichContent :source="item.content.body" :pages="kind==='chapter'?item.content.pages:undefined" :paged="kind==='chapter'" />
        <TipLinksReader v-if="kind==='tip'" :tags="item.content.details.tags" :related-tips="item.content.details.relatedTips" />
        <WordMeaningsReader v-if="kind==='word'" :serialized="item.content.details.meanings" />
        <LanguageStructureReader v-if="kind==='language'" :characters="item.content.details.characters" :word-classes="item.content.details.wordClasses" />
        <dl v-if="Object.keys(displayDetails).length" class="reader-details"><template v-for="(value,key) in displayDetails" :key="key">
          <dt>{{ key }}</dt><dd>{{ value }}</dd>
        </template></dl>
        <nav v-if="kind==='chapter'" class="chapter-navigation" :aria-label="t('readerChapterNavigation')">
          <NuxtLink v-if="prev" :to="publicNodeRoute(tree??[],prev.id)??'#'">{{ t('readerPreviousChapter') }} {{ prev.content.title }}</NuxtLink>
          <NuxtLink :to="publicAreaRoute(seriesId,'stories')">{{ t('readerBackToToc') }}</NuxtLink>
          <NuxtLink v-if="next" :to="publicNodeRoute(tree??[],next.id)??'#'">{{ t('readerNextChapter') }} {{ next.content.title }}</NuxtLink>
        </nav>
        <NuxtLink v-else-if="languageDetails&&languageHome" :to="languageHome">{{ t('readerBackToToc') }}</NuxtLink>
      </article>
    </ReaderPanel>
  </div>
</template>
<style scoped>
.reader-details { display:grid;grid-template-columns:minmax(5rem,auto) 1fr;gap:.6rem 1rem; }
.reader-details dt { color:var(--color-text-note); }
.reader-details dd { margin:0;overflow-wrap:anywhere; }
.chapter-navigation { border-top:1px solid var(--color-border-base);padding-top:1rem;margin-top:2rem;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem; }
</style>
