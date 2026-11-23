<script setup lang="ts">
import type {AuthorNode} from '~/types/author';
import type {ReaderKind} from '~/types/reader';
import StudioEditor from '~/pages/studio.vue';
const props=defineProps<{ seriesId:string; nodeId:string; kind:ReaderKind }>();
const {t}=useUiLocale();
const {data:auth,refresh:refreshAuth}=await useFetch<{authenticated:boolean}>('/api/auth/me');
const {data:nodes,refresh}=await useFetch<AuthorNode[]>('/api/admin/nodes',{immediate:!!auth.value?.authenticated,watch:[auth]});
onMounted(async()=>{await refreshAuth();if(auth.value?.authenticated)await refresh();});
const byId=computed(()=>new Map((nodes.value??[]).map(n=>[n.id,n])));
const valid=computed(()=>{
  let node=byId.value.get(props.nodeId);
  if(!node||node.kind!==props.kind)return false;
  const seen=new Set<string>();
  while(node&&!seen.has(node.id)){
    if(node.kind==='series')return node.id===props.seriesId;
    seen.add(node.id);node=node.parentId?byId.value.get(node.parentId):undefined;
  }
  return false;
});
</script>
<template><div class="admin-editor-page">
  <div v-if="!auth?.authenticated" role="alert"><ReaderPanel>{{ t('studioLoginRequired') }}</ReaderPanel></div>
  <StudioEditor v-else-if="valid" />
  <ReaderPanel v-else><h1>{{ t('readerErrorNotPublic') }}</h1></ReaderPanel>
</div></template>
<style scoped>
.admin-editor-page :deep(.studio-sidebar){display:none;}
.admin-editor-page :deep(.studio-grid){grid-template-columns:minmax(0,1fr);}
</style>
