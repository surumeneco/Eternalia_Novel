<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } = await useFetch<AuthState>('/api/auth/me');
const nodes = ref<AuthorNode[]>([]);
const selectedParent = ref('root');
const selectedKind = ref<ReaderKind>('series');
const orderedIds = ref<string[]>([]);
const loading = ref(false);
const busy = ref(false);
const errorText = ref('');
const statusText = ref('');
const kinds: Record<ReaderKind, string> = {
  series:'シリーズ',volume:'編',part:'部',chapter:'章',category:'カテゴリ',
  tip:'設定',tipSection:'設定項目',language:'言語',word:'単語',
  grammar:'文法',periodization:'年代区分',event:'出来事',
};
const kindsByParent: Record<ReaderKind | 'root', ReaderKind[]> = {
  root:['series'],series:['volume','category','language','periodization'],
  volume:['part'],part:['chapter'],chapter:[],category:['tip'],tip:['tipSection'],
  tipSection:[],language:['word','grammar'],word:[],grammar:[],
  periodization:['event'],event:[],
};
const byId = computed(() => new Map(nodes.value.map(n => [n.id,n])));
const parents = computed(() => [
  { id:'root', title:'全シリーズ', kind:'root' as const },
  ...nodes.value.filter(node => kindsByParent[node.kind].length).map(node => ({
    id:node.id,title:node.draft.title,kind:node.kind,
  })),
]);
const chosenParent = computed(() => parents.value.find(parent => parent.id === selectedParent.value));
const choices = computed(() => kindsByParent[chosenParent.value?.kind ?? 'root']);
const siblings = computed(() =>
  nodes.value.filter(node =>
    node.parentId === (selectedParent.value === 'root' ? null : selectedParent.value) &&
    node.kind === selectedKind.value)
    .sort((a,b) => a.order - b.order || a.id.localeCompare(b.id)),
);
const ordered = computed(() => orderedIds.value.map(id => byId.value.get(id)).filter((item):item is AuthorNode => !!item));
const changed = computed(() => orderedIds.value.some((id,i) => id !== siblings.value[i]?.id));
function restore() { orderedIds.value = siblings.value.map(node => node.id); }
watch([selectedParent,choices], () => {
  if (!choices.value.includes(selectedKind.value)) selectedKind.value = choices.value[0] ?? 'series';
});
watch([selectedParent,selectedKind,siblings], restore, { immediate:true });
function move(index:number, delta:number) {
  const to=index+delta;
  if (to<0||to>=orderedIds.value.length) return;
  const copy=[...orderedIds.value];
  [copy[index],copy[to]]=[copy[to]!,copy[index]!];
  orderedIds.value=copy;
}
async function load() {
  loading.value=true;
  errorText.value='';
  try {
    nodes.value=await $fetch<AuthorNode[]>('/api/admin/nodes');
    if (selectedParent.value!=='root' && !byId.value.has(selectedParent.value)) selectedParent.value='root';
    restore();
  } catch {
    errorText.value='項目を取得できませんでした。';
  } finally {loading.value=false;}
}
async function save() {
  if (!changed.value || busy.value) return;
  if (!window.confirm('この操作は公開中の項目の表示順にも反映されます。並べ替えますか？')) return;
  busy.value=true;
  errorText.value='';
  statusText.value='';
  try {
    await $fetch('/api/admin/order',{
      method:'POST',
      body:{
        parentId:selectedParent.value==='root'?null:selectedParent.value,
        kind:selectedKind.value,
        orderedIds:[...orderedIds.value],
        expectedRevisions:Object.fromEntries(siblings.value.map(node=>[node.id,node.revision])),
      },
    });
    await load();
    statusText.value='順序を反映しました。';
  } catch (error:unknown) {
    const response=error as {data?:{message?:string}};
    errorText.value=response.data?.message ?? '並べ替えに失敗しました。競合の可能性があります。再読込してください。';
  } finally {busy.value=false;}
}
function confirmDiscard() {
  return !changed.value || window.confirm('未反映の並べ替えを破棄しますか？');
}
onBeforeRouteLeave(()=>confirmDiscard());
onMounted(async()=>{
  await refreshAuth();
  if (auth.value?.authenticated) await load();
});
</script>

<template>
  <div>
    <TopicPath :items="[{label:'ホーム',to:'/'},{label:'作者の書斎',to:'/studio'},{label:'並べ替え'}]"/>
    <ReaderPanel>
      <h1>並べ替え</h1>
      <p class="note">同じ親・同じ種類の項目を並べ替えます。反映すると公開中の表示順も変更されます。</p>
      <p v-if="authPending" role="status">認証状態を確認しています。</p>
      <div v-else-if="!auth?.configured" role="alert">作者認証が設定されていません。</div>
      <div v-else-if="!auth.authenticated" role="alert">
        <p>作者としてログインしてください。</p>
        <a href="/api/auth/discord">Discordでログイン</a>
      </div>
      <template v-else>
        <div class="order-filters">
          <label>親となる項目
            <select v-model="selectedParent" :disabled="loading||busy" @change="restore">
              <option v-for="parent in parents" :key="parent.id" :value="parent.id">{{ parent.title }}（{{ parent.kind==='root'?'全体':kinds[parent.kind] }}）</option>
            </select>
          </label>
          <label>項目の種類
            <select v-model="selectedKind" :disabled="loading||busy">
              <option v-for="kind in choices" :key="kind" :value="kind">{{ kinds[kind] }}</option>
            </select>
          </label>
        </div>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <p v-if="statusText" role="status">{{ statusText }}</p>
        <p v-if="loading">項目を取得しています。</p>
        <p v-else-if="!ordered.length">この階層に項目はありません。</p>
        <ol v-else class="order-list">
          <li v-for="(node,index) in ordered" :key="node.id">
            <span>{{ node.draft.title }}</span>
            <div class="order-actions">
              <button type="button" class="inline-action" :disabled="index===0||busy" :aria-label="node.draft.title+'を上へ移動'" @click="move(index,-1)">上へ</button>
              <button type="button" class="inline-action" :disabled="index===ordered.length-1||busy" :aria-label="node.draft.title+'を下へ移動'" @click="move(index,1)">下へ</button>
            </div>
          </li>
        </ol>
        <div class="order-toolbar">
          <button type="button" class="inline-action" :disabled="busy||loading||!changed" @click="restore">変更を取り消す</button>
          <button type="button" class="order-save" :disabled="busy||loading||!changed" @click="save">表示順を反映</button>
          <NuxtLink to="/studio">執筆・編集に戻る</NuxtLink>
        </div>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.order-filters { display:flex;flex-wrap:wrap;gap:1rem;margin:1rem 0; }
.order-filters label { flex:1 1 12rem; }
.order-filters select { display:block;max-width:100%;width:100%;margin-top:.4rem;padding:.5rem;background:var(--color-background-input);color:var(--color-text-base);border:1px solid var(--color-border-base); }
.order-list { list-style:decimal inside;padding:0; }
.order-list li { display:flex;gap:1rem;justify-content:space-between;align-items:center;padding:.65rem;border-bottom:1px solid var(--color-border-base); }
.order-list li > span { overflow-wrap:anywhere; }
.order-actions,.order-toolbar { display:flex;align-items:center;gap:.5rem;flex-wrap:wrap; }
.order-toolbar { margin-top:1.25rem; }
.order-save { background:#00698c;border:1px solid var(--color-concept-main);color:#fff;padding:.4rem .75rem; }
@media(max-width:600px){.order-list li{align-items:flex-start;flex-direction:column;}}
</style>
