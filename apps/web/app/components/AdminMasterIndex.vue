<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
const props=defineProps<{kind:'language'|'tip';title:string}>();
const {t}=useUiLocale();
const {data:auth,refresh:refreshAuth}=await useFetch<{authenticated:boolean}>('/api/auth/me');
const {data:nodes,refresh}=await useFetch<AuthorNode[]>('/api/admin/nodes',{
  immediate:!!auth.value?.authenticated,watch:[auth],
});
onMounted(async()=>{await refreshAuth();if(auth.value?.authenticated)await refresh();});
const byId=computed(()=>new Map((nodes.value??[]).map(n=>[n.id,n])));
function seriesFor(node:AuthorNode):AuthorNode|null{
  let cur:AuthorNode|undefined=node;const seen=new Set<string>();
  while(cur&&!seen.has(cur.id)){
    if(cur.kind==='series')return cur;
    seen.add(cur.id);cur=cur.parentId?byId.value.get(cur.parentId):undefined;
  }
  return null;
}
type Entry={node:AuthorNode;series:AuthorNode};
const entries=computed<Entry[]>(()=>{
  const result:Entry[]=[];
  for(const node of nodes.value??[]){
    if(node.kind!==props.kind)continue;
    const series=seriesFor(node);
    if(series)result.push({node,series});
  }
  return result;
});
function tagsOf(node:AuthorNode):string[]{
  try{
    const source:unknown=JSON.parse(node.draft.details.tags??'[]');
    return Array.isArray(source)?[...new Set(source.filter((value):value is string=>
      typeof value==='string'&&value.trim().length>0))]:[];
  }catch{return [];}
}
function classesOf(node:AuthorNode):string[]{
  try{
    const source:unknown=JSON.parse(node.draft.details.wordClasses??'[]');
    if(!Array.isArray(source))return [];
    return source.filter((item):item is {name:string}=>
      !!item&&typeof item==='object'&&typeof item.name==='string'&&item.name.length>0)
      .map(item=>item.name);
  }catch{return [];}
}
const tagGroups=computed(()=>{
  const byTag=new Map<string,{series:AuthorNode;tag:string;items:Entry[]}>();
  for(const entry of entries.value){
    for(const tag of tagsOf(entry.node)){
      const key=entry.series.id+'\u0000'+tag;
      const group=byTag.get(key)??{series:entry.series,tag,items:[]};
      group.items.push(entry);
      byTag.set(key,group);
    }
  }
  return [...byTag.values()].sort((a,b)=>a.series.draft.title.localeCompare(b.series.draft.title,'ja')||
    a.tag.localeCompare(b.tag,'ja'));
});
function edit(entry:Entry){
  const seriesId=encodeURIComponent(entry.series.id);
  const itemId=encodeURIComponent(entry.node.id);
  return '/admin/series/'+seriesId+'/'+(props.kind==='tip'?'settings/tips/':'dictionaries/languages/')+itemId+'/edit';
}
</script>
<template>
  <ReaderPanel>
    <h1>{{ title }}</h1>
    <div v-if="!auth?.authenticated" role="alert">{{ t('studioLoginRequired') }}</div>
    <template v-else>
      <p class="note">{{ t('masterScopeNote') }}</p>
      <div class="master-grid">
        <template v-if="kind==='tip'">
          <article v-for="group in tagGroups" :key="group.series.id+'-'+group.tag" class="stone-panel">
            <h2>{{ group.tag }}</h2>
            <p class="note">{{ group.series.draft.title }}</p>
            <ul>
              <li v-for="entry in group.items" :key="entry.node.id">
                <NuxtLink :to="edit(entry)">{{ entry.node.draft.title }}</NuxtLink>
              </li>
            </ul>
          </article>
        </template>
        <template v-else>
          <article v-for="entry in entries" :key="entry.node.id" class="stone-panel">
            <h2>{{ entry.node.draft.title }}</h2>
            <p class="note">{{ entry.series.draft.title }}</p>
            <ul>
              <li v-for="name in classesOf(entry.node)" :key="name">{{ name }}</li>
            </ul>
            <NuxtLink :to="edit(entry)">{{ t('pubEdit') }}</NuxtLink>
          </article>
        </template>
      </div>
      <p v-if="kind==='tip'?!tagGroups.length:!entries.length">{{ t('studioEmpty') }}</p>
    </template>
  </ReaderPanel>
</template>
<style scoped>
.master-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem;}
.master-grid ul{padding-inline-start:1.5rem;}
.master-grid li{overflow-wrap:anywhere;}
</style>
