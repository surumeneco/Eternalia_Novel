<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';
import { adminCreatePath, adminEditPath } from '~/utils/admin-node-route';
const props=defineProps<{ seriesId?:string; kind:ReaderKind; title:string; editRoot?:string }>();
const {t}=useUiLocale();
const {data:auth,pending:authPending,refresh:refreshAuth}=await useFetch<{authenticated:boolean}>('/api/auth/me');
const {data:nodes,pending,error,refresh}=await useFetch<AuthorNode[]>('/api/admin/nodes',{
  immediate:!!auth.value?.authenticated,watch:[auth],default:()=>[],
});
onMounted(async()=>{await refreshAuth();if(auth.value?.authenticated)await refresh();});
const byId=computed(()=>new Map((nodes.value??[]).map(n=>[n.id,n])));
function ancestry(node:AuthorNode):AuthorNode[]{
  const result:AuthorNode[]=[];const seen=new Set<string>();let current:AuthorNode|undefined=node;
  while(current&&!seen.has(current.id)){result.unshift(current);seen.add(current.id);
    current=current.parentId?byId.value.get(current.parentId):undefined;}
  return result;
}
const records=computed(()=>(nodes.value??[]).filter(node=>node.kind===props.kind&&
  (!props.seriesId||ancestry(node)[0]?.id===props.seriesId))
  .sort((a,b)=>a.order-b.order||a.draft.title.localeCompare(b.draft.title,'ja')));
const parentKind:Record<ReaderKind,ReaderKind|null>={series:null,volume:'series',part:'volume',chapter:'part',
  category:'series',tip:'category',tipSection:'tip',language:'series',word:'language',grammar:'language',
  periodization:'series',event:'periodization'};
const createParents=computed(()=>(nodes.value??[]).filter(n=>n.kind===parentKind[props.kind]&&
  (!props.seriesId||ancestry(n)[0]?.id===props.seriesId)));
function editorPath(node:AuthorNode):string{
  return adminEditPath(props.seriesId??node.id,node.kind,node.id);
}
</script>
<template>
  <div><ReaderPanel><h1>{{ title }}</h1>
    <p v-if="authPending" role="status">{{ t('studioAuthChecking') }}</p>
    <div v-else-if="!auth?.authenticated" role="alert">{{ t('studioLoginRequired') }}</div>
    <template v-else>
      <div class="grid-create">
        <NuxtLink v-if="kind==='series'" :to="adminCreatePath(null,'series',null)">{{ t('studioNewSeries') }}</NuxtLink>
        <template v-else>
          <NuxtLink v-for="parent in createParents" :key="parent.id" :to="adminCreatePath(seriesId??null,kind,parent.id)">
            {{ t('studioCreate') }} ({{ parent.draft.title }})
          </NuxtLink>
        </template>
      </div>
      <p v-if="error" role="alert" class="error-text">{{ t('studioLibraryLoadError') }}
        <button type="button" class="inline-action" @click="refresh()">{{ t('retry') }}</button></p>
      <p v-else-if="pending" role="status">{{ t('loading') }}</p>
      <div v-else class="admin-grid-scroller">
        <table class="admin-node-grid"><thead><tr><th scope="col">{{ t('studioNameHeading') }}</th>
          <th scope="col">{{ t('studioKindLabel') }}</th><th scope="col">{{ t('pubSelfLabel') }}</th>
          <th scope="col">{{ t('pubSnapshotLabel') }}</th><th scope="col">{{ t('pubEdit') }}</th></tr></thead>
          <tbody><tr v-for="node in records" :key="node.id">
            <th scope="row"><NuxtLink v-if="kind==='series'" :to="'/admin/series/'+encodeURIComponent(node.id)">{{ node.draft.title }}</NuxtLink><template v-else>{{ node.draft.title }}</template></th>
            <td>{{ node.parentId?byId.get(node.parentId)?.draft.title??'—':'—' }}</td>
            <td>{{ node.isPublic?t('pubPublic'):t('pubPrivate') }}</td>
            <td>{{ node.published?t('pubYes'):t('pubNo') }}</td>
            <td><NuxtLink :to="editorPath(node)">{{ t('pubEdit') }}</NuxtLink></td>
          </tr></tbody>
        </table>
        <p v-if="!records.length">{{ t('studioEmpty') }}</p>
      </div>
    </template>
  </ReaderPanel></div>
</template>
<style scoped>
.grid-create { display:flex;flex-wrap:wrap;gap:.65rem;margin:1rem 0; }
.grid-create a { padding:.35rem .6rem;border:1px solid var(--color-border-base); }
.admin-grid-scroller { overflow-x:auto; }
.admin-node-grid { width:100%;border-collapse:collapse; }
.admin-node-grid td,.admin-node-grid th { padding:.65rem;text-align:left;border-bottom:1px solid var(--color-border-base); }
.admin-node-grid tbody tr:hover { background:var(--color-background-soft); }
</style>
