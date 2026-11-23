<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import { pagesForChapter } from '@eternalia/contracts';
const props=defineProps<{seriesId:string;chapterId:string}>();
const {t}=useUiLocale();
const {data:auth,refresh:refreshAuth}=await useFetch<{authenticated:boolean}>('/api/auth/me');
const {data:nodes,refresh}=await useFetch<AuthorNode[]>('/api/admin/nodes',{immediate:!!auth.value?.authenticated,watch:[auth]});
onMounted(async()=>{await refreshAuth();if(auth.value?.authenticated)await refresh();});
const byId=computed(()=>new Map((nodes.value??[]).map(n=>[n.id,n])));
const chapter=computed(()=>byId.value.get(props.chapterId));
const valid=computed(()=>{
  if(chapter.value?.kind!=='chapter')return false;
  let n:AuthorNode|undefined=chapter.value;const seen=new Set<string>();
  while(n&&!seen.has(n.id)){if(n.kind==='series')return n.id===props.seriesId;
    seen.add(n.id);n=n.parentId?byId.value.get(n.parentId):undefined;}
  return false;
});
</script>
<template><ReaderPanel><div v-if="valid&&chapter">
  <h1>{{chapter.draft.title}}</h1><p class="note">{{t('studioDraftPreview')}}</p>
  <RichContent :source="chapter.draft.body" :pages="pagesForChapter(chapter.draft)" paged />
  <NuxtLink :to="'/admin/series/'+seriesId+'/stories/chapters/'+chapterId+'/edit'">{{t('pubEdit')}}</NuxtLink>
</div><p v-else>{{t('readerErrorNotPublic')}}</p></ReaderPanel></template>
