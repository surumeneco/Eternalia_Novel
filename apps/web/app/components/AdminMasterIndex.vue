<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
const props=defineProps<{kind:'language'|'tip';title:string}>();
const {t}=useUiLocale();
const {data:auth,refresh:refreshAuth}=await useFetch<{authenticated:boolean}>('/api/auth/me');
const {data:nodes,refresh}=await useFetch<AuthorNode[]>('/api/admin/nodes',{immediate:!!auth.value?.authenticated,watch:[auth]});
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
const entries=computed(()=>(nodes.value??[]).filter(n=>n.kind===props.kind).map(n=>({
  node:n,series:seriesFor(n),summary:props.kind==='tip'?n.draft.details.tags??'':n.draft.details.wordClasses??'',
})).filter(x=>x.series));
function edit(entry:(typeof entries.value)[number]){
  const id=encodeURIComponent(entry.series!.id);
  return '/admin/series/'+id+'/'+(props.kind==='tip'?'settings/tips/'+entry.node.id:'/dictionaries/languages/'+entry.node.id)+'/edit';
}
</script>
<template><ReaderPanel><h1>{{title}}</h1>
  <div v-if="!auth?.authenticated" role="alert">{{t('studioLoginRequired')}}</div>
  <p v-else class="note">{{t('masterScopeNote')}}</p>
  <div v-if="auth?.authenticated" class="master-grid">
    <article v-for="entry in entries" :key="entry.node.id" class="stone-panel">
      <h2>{{entry.node.draft.title}}</h2><p class="note">{{entry.series?.draft.title}}</p>
      <NuxtLink :to="edit(entry)">{{t('pubEdit')}}</NuxtLink>
    </article>
  </div>
</ReaderPanel></template>
<style scoped>
.master-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem;}
</style>
