<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';
const { t } = useUiLocale();

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
  series:t('studioKindSeries'),volume:t('studioKindVolume'),part:t('studioKindPart'),chapter:t('chapter'),category:t('studioKindCategory'),
  tip:t('tip'),tipSection:t('tipSection'),language:t('studioKindLanguage'),word:t('word'),
  grammar:t('grammar'),periodization:t('studioKindPeriodization'),event:t('event'),
};
const kindsByParent: Record<ReaderKind | 'root', ReaderKind[]> = {
  root:['series'],series:['volume','category','language','periodization'],
  volume:['part'],part:['chapter'],chapter:[],category:['tip'],tip:['tipSection'],
  tipSection:[],language:['word','grammar'],word:[],grammar:[],
  periodization:['event'],event:[],
};
const byId = computed(() => new Map(nodes.value.map(n => [n.id,n])));
const parents = computed(() => [
  { id:'root', title:t('orderAllSeries'), kind:'root' as const },
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
async function load(): Promise<boolean> {
  loading.value=true;
  errorText.value='';
  try {
    nodes.value=await $fetch<AuthorNode[]>('/api/admin/nodes');
    if (selectedParent.value!=='root' && !byId.value.has(selectedParent.value)) selectedParent.value='root';
    restore();
    return true;
  } catch {
    errorText.value=t('orderLoadError');
    return false;
  } finally {loading.value=false;}
}
async function save() {
  if (!changed.value || busy.value) return;
  if (!window.confirm(t('orderConfirm'))) return;
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
    if (await load()) statusText.value=t('orderSaved');
    else errorText.value=t('orderReloadFailed');
  } catch (error:unknown) {
    const response=error as {data?:{message?:string}};
    errorText.value=response.data?.message ?? t('orderSaveFailed');
  } finally {busy.value=false;}
}
function confirmDiscard() {
  return !changed.value || window.confirm(t('orderDiscard'));
}
function changeParent(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (!confirmDiscard()) {
    select.value = selectedParent.value;
    return;
  }
  selectedParent.value = select.value;
}
function changeKind(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (!confirmDiscard()) {
    select.value = selectedKind.value;
    return;
  }
  selectedKind.value = select.value as ReaderKind;
}
async function reload() {
  if (confirmDiscard()) await load();
}
onBeforeRouteLeave(()=>confirmDiscard());
function beforeUnload(event: BeforeUnloadEvent) {
  if (!changed.value) return;
  event.preventDefault();
  event.returnValue = '';
}
onMounted(async()=>{
  window.addEventListener('beforeunload', beforeUnload);
  await refreshAuth();
  if (auth.value?.authenticated) await load();
});
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
</script>

<template>
  <div>
    <TopicPath :items="[{label:t('home'),to:'/'},{label:t('studio'),to:'/studio'},{label:t('studioReorder')}]"/>
    <ReaderPanel>
      <h1>{{ t('studioReorder') }}</h1>
      <p class="note">{{ t('orderDescription') }}</p>
      <p v-if="authPending" role="status">{{ t('studioAuthChecking') }}</p>
      <div v-else-if="!auth?.configured" role="alert">{{ t('orderAuthNotConfigured') }}</div>
      <div v-else-if="!auth.authenticated" role="alert">
        <p>{{ t('orderLoginRequired') }}</p>
        <a href="/api/auth/discord">{{ t('studioDiscordLogin') }}</a>
      </div>
      <template v-else>
        <div class="order-filters">
          <label>{{ t('orderParentLabel') }}
            <select :value="selectedParent" :disabled="loading||busy" @change="changeParent">
              <option v-for="parent in parents" :key="parent.id" :value="parent.id">{{ parent.title }}（{{ parent.kind==='root'?t('orderAll'):kinds[parent.kind] }}）</option>
            </select>
          </label>
          <label>{{ t('orderKindLabel') }}
            <select :value="selectedKind" :disabled="loading||busy" @change="changeKind">
              <option v-for="kind in choices" :key="kind" :value="kind">{{ kinds[kind] }}</option>
            </select>
          </label>
        </div>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <p v-if="statusText" role="status">{{ statusText }}</p>
        <p v-if="loading">{{ t('orderLoading') }}</p>
        <p v-else-if="!ordered.length">{{ t('orderEmpty') }}</p>
        <ol v-else class="order-list">
          <li v-for="(node,index) in ordered" :key="node.id">
            <span>{{ node.draft.title }}</span>
            <div class="order-actions">
              <button type="button" class="inline-action" :disabled="index===0||busy" :aria-label="node.draft.title + t('orderMoveUpSuffix')" @click="move(index,-1)">{{ t('orderUp') }}</button>
              <button type="button" class="inline-action" :disabled="index===ordered.length-1||busy" :aria-label="node.draft.title + t('orderMoveDownSuffix')" @click="move(index,1)">{{ t('orderDown') }}</button>
            </div>
          </li>
        </ol>
        <div class="order-toolbar">
          <button type="button" class="inline-action" :disabled="busy||loading||!changed" @click="restore">{{ t('orderUndo') }}</button>
          <button type="button" class="inline-action" :disabled="busy||loading" @click="reload">{{ t('orderReload') }}</button>
          <button type="button" class="order-save" :disabled="busy||loading||!changed" @click="save">{{ t('orderApply') }}</button>
          <NuxtLink to="/studio">{{ t('orderBack') }}</NuxtLink>
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
