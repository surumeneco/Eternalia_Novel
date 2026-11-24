<script setup lang="ts">
import { localizeApiError } from '~/utils/api-error-localization';
import { parseJstLocalDateTime, formatJstLocalDateTime, formatJstDisplay } from '~/utils/jst-publication-time';
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';
import { canReadPublished } from '@eternalia/contracts';
const { t, language } = useUiLocale();
const { confirm: showConfirmation } = useAppDialog();
const route = useRoute();
const canonicalSeriesId = computed(() => typeof route.params.id === 'string' ? route.params.id : null);

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } = await useFetch<AuthState>('/api/auth/me');
const nodes = ref<AuthorNode[]>([]);
const loading = ref(false);
const busyId = ref<string | null>(null);
const errorText = ref('');
const successText = ref('');
const selectedSeriesId = ref<string>('');
const section = ref('series');
const statusFilter = ref('all');
const search = ref('');
const scheduled = reactive<Record<string, string>>({});
const batchSelection=ref<string[]>([]);

const types = computed<Record<ReaderKind, string>>(() => ({
  series: t('studioKindSeries'), volume: t('studioKindVolume'), part: t('studioKindPart'), chapter: t('chapter'),
  category: t('studioKindCategory'), tip: t('tip'), tipSection: t('tipSection'),
  language: t('studioKindLanguage'), word: t('word'), grammar: t('grammar'),
  periodization: t('studioKindPeriodization'), event: t('event'),
}));
const sections: Record<string, ReaderKind[]> = {
  series: ['series'],
  stories: ['volume', 'part', 'chapter'],
  tips: ['category', 'tip', 'tipSection'],
  dictionaries: ['language', 'word', 'grammar'],
  timeline: ['periodization', 'event'],
};
const byId = computed(() => new Map(nodes.value.map(node => [node.id, node])));
const seriesList = computed(() => nodes.value.filter(node => node.kind === 'series' && node.parentId === null)
  .sort((a, b) => a.order - b.order || a.draft.title.localeCompare(b.draft.title, 'ja')));
function sectionForKind(kind: ReaderKind): string {
  if (kind === 'series') return 'series';
  if (kind === 'category' || kind === 'tip' || kind === 'tipSection') return 'tips';
  if (kind === 'language' || kind === 'word' || kind === 'grammar') return 'dictionaries';
  if (kind === 'periodization' || kind === 'event') return 'timeline';
  return 'stories';
}
const kindOrder: Record<ReaderKind, number> = {
  series: 0, volume: 0, part: 0, chapter: 0,
  category: 1, tip: 0, tipSection: 0,
  language: 2, word: 0, grammar: 1,
  periodization: 3, event: 0,
};
function ancestry(node: AuthorNode, usePublishedParent = false): AuthorNode[] {
  const path: AuthorNode[] = [];
  const visited = new Set<string>();
  let current: AuthorNode | undefined = node;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    // Published ancestry is immutable across draft moves. Missing legacy
    // snapshot-parent data retains the existing draft-parent fallback.
    const publishedParentId: string | null | undefined = current.published?.parentId;
    const parentId: string | null = usePublishedParent && publishedParentId !== undefined
      ? publishedParentId : current.parentId;
    current = parentId ? byId.value.get(parentId) : undefined;
  }
  return path;
}
function published(node: AuthorNode): boolean {
  const path = ancestry(node, true);
  // Keep author filters aligned with the domain gate used by public APIs.
  return canReadPublished(
    path.map(item => ({ isPublic: item.isPublic, publicSinceEpochMs: item.publicSince })),
    path.every(item => item.published !== null), Date.now(),
  );
}
function status(node: AuthorNode): string {
  if (!node.published) return t('pubNoSnapshot');
  if (!node.isPublic) return t('pubSelfPrivate');
  if (node.publicSince === null) return t('pubDateUnset');
  if (node.publicSince > Date.now()) return t('pubPending');
  const blocked = ancestry(node, true).slice(0, -1).find(item =>
    !item.published || !item.isPublic || item.publicSince === null || item.publicSince > Date.now());
  return blocked ? t('pubAncestorPrivate') : t('pubVisible');
}
const filtered = computed(() => nodes.value.filter(node => {
  // Public management is per-series. Never interleave unrelated worlds.
  if (!selectedSeriesId.value || ancestry(node)[0]?.id !== selectedSeriesId.value) return false;
  if (!sections[section.value]?.includes(node.kind)) return false;
  if (search.value.trim()) {
    const needle = search.value.trim().toLocaleLowerCase();
    if (!ancestry(node).some(part => part.draft.title.toLocaleLowerCase().includes(needle))) return false;
  }
  if (statusFilter.value === 'visible' && !published(node)) return false;
  if (statusFilter.value === 'hidden' && published(node)) return false;
  if (statusFilter.value === 'unpublished' && node.published) return false;
  return true;
}).sort((a, b) => {
  const left = ancestry(a).flatMap(node => [kindOrder[node.kind], node.order]);
  const right = ancestry(b).flatMap(node => [kindOrder[node.kind], node.order]);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i]! - right[i]!;
  }
  return left.length - right.length || a.id.localeCompare(b.id);
}));
async function changeSeries(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  selectedSeriesId.value = seriesList.value.some(item => item.id === id) ? id : '';
  section.value = 'series';
  statusFilter.value = 'all';
  search.value = '';
  errorText.value = '';
  successText.value = '';
  if (canonicalSeriesId.value) {
    await navigateTo(selectedSeriesId.value ? '/admin/series/' + encodeURIComponent(selectedSeriesId.value) + '/publication' : '/admin/series', { replace: true });
  } else {
    await navigateTo({ path: '/studio/publication', query: selectedSeriesId.value ? { series: selectedSeriesId.value } : {} }, { replace: true });
  }
}
function editorPath(node: AuthorNode): string {
  const root = '/admin/series/' + encodeURIComponent(selectedSeriesId.value);
  if (node.kind === 'series') return root + '/edit';
  const groups: Record<Exclude<ReaderKind, 'series'>, string> = {
    volume:'stories/volumes', part:'stories/parts', chapter:'stories/chapters',
    category:'settings/categories', tip:'settings/tips', tipSection:'settings/sections',
    language:'dictionaries/languages', word:'dictionaries/words', grammar:'dictionaries/grammar',
    periodization:'timeline/periods', event:'timeline/events',
  };
  return root + '/' + groups[node.kind] + '/' + encodeURIComponent(node.id) + '/edit';
}
function pathTitle(node: AuthorNode): string {
  return ancestry(node).map(item => item.draft.title).join(' / ');
}
async function load(): Promise<boolean> {
  if (!auth.value?.authenticated) return false;
  loading.value = true;
  errorText.value = '';
  try {
    nodes.value = await $fetch<AuthorNode[]>('/api/admin/nodes');
    for (const node of nodes.value) {
      scheduled[node.id] = node.publicSince === null ? '' : (formatJstLocalDateTime(node.publicSince) ?? '');
    }
    if (!seriesList.value.some(node => node.id === selectedSeriesId.value)) {
      selectedSeriesId.value = '';
    }
    return true;
  } catch {
    errorText.value = t('pubLoadError');
    return false;
  } finally {
    loading.value = false;
  }
}
onMounted(async () => {
  await refreshAuth();
  if (!auth.value?.authenticated || !await load()) return;
  const requestedSeries = typeof route.params.id === 'string' ? route.params.id : typeof route.query.series === 'string' ? route.query.series : '';
  const requestedTarget = typeof route.query.target === 'string' ? byId.value.get(route.query.target) : null;
  const targetSeriesId = requestedTarget ? ancestry(requestedTarget)[0]?.id ?? '' : '';
  if (requestedSeries && seriesList.value.some(node => node.id === requestedSeries)) {
    selectedSeriesId.value = requestedSeries;
  } else if (!canonicalSeriesId.value && targetSeriesId && seriesList.value.some(node => node.id === targetSeriesId)) {
    selectedSeriesId.value = targetSeriesId;
  }
  if (requestedTarget && targetSeriesId === selectedSeriesId.value) {
    section.value = sectionForKind(requestedTarget.kind);
  }
});
async function updateBatch(kind:'publish'|'show'|'hide') {
  if(busyId.value||!auth.value?.authenticated)return;
  const chosen=filtered.value.filter(n=>batchSelection.value.includes(n.id));
  if(!chosen.length)return;
  if(kind==='publish'&&!await showConfirmation(t('pubPublishConfirm')))return;
  busyId.value='batch';errorText.value='';successText.value='';
  let completed=0;
  const errors:string[]=[];
  for(const node of chosen){
    if(kind==='show'&&!node.published){errors.push(node.draft.title);continue;}
    try{
      const endpoint=kind==='publish'?'publish':'visibility';
      const body=kind==='publish'?{expectedRevision:node.revision}:{expectedRevision:node.revision,
        isPublic:kind==='show',publicSince:node.publicSince};
      await $fetch('/api/admin/nodes/'+encodeURIComponent(node.id)+'/'+endpoint,{method:'POST',body});
      completed++;
    }catch{errors.push(node.draft.title);}
  }
  batchSelection.value=[];
  const loaded=await load();
  // As with single-item writes, a failed readback cannot certify the
  // resulting management state. Preserve any known per-item failures.
  successText.value=loaded&&completed?t('pubBatchCompleted')+' '+completed:'';
  const failed=errors.length?t('pubUpdateFailed')+' : '+errors.join('、'):'';
  errorText.value=[!loaded?t('pubLoadError'):'',failed].filter(Boolean).join(' / ');
  busyId.value=null;
}
async function saveSchedule(node: AuthorNode) {
  if (busyId.value || !node.published) return;
  const input = scheduled[node.id];
  // Empty means clear the future schedule. The domain visibility contract
  // normalizes null to the current time for an already-published public item.
  const time = input ? parseJstLocalDateTime(input) : null;
  if (input && time === null) {
    errorText.value = t('pubDateRequired');
    return;
  }
  busyId.value = node.id;
  errorText.value = '';
  successText.value = '';
  try {
    await $fetch('/api/admin/nodes/' + encodeURIComponent(node.id) + '/visibility', {
      method: 'POST',
      body: { expectedRevision: node.revision, isPublic: node.isPublic, publicSince: time },
    });
    // A successful POST is not a verified final state if the readback fails.
    if (await load()) successText.value = t('pubDateSaved');
  } catch {
    errorText.value = t('pubDateSaveFailed');
  } finally {
    busyId.value = null;
  }
}
async function action(node: AuthorNode, kind: 'publish' | 'visibility') {
  if (busyId.value) return;
  if (kind === 'publish' && !await showConfirmation(t('pubPublishConfirm'))) return;
  const nextVisibility = !node.isPublic;
  if (kind === 'visibility' && nextVisibility && !node.published) {
    errorText.value = t('pubPublishFirst');
    return;
  }
  busyId.value = node.id;
  errorText.value = '';
  successText.value = '';
  try {
    if (kind === 'publish') {
      await $fetch('/api/admin/nodes/' + encodeURIComponent(node.id) + '/publish', {
        method: 'POST', body: { expectedRevision: node.revision },
      });
    } else {
      await $fetch('/api/admin/nodes/' + encodeURIComponent(node.id) + '/visibility', {
        method: 'POST',
        body: { expectedRevision: node.revision, isPublic: nextVisibility, publicSince: node.publicSince },
      });
    }
    if (await load()) successText.value = t('pubUpdated');
  } catch (error: unknown) {
    errorText.value = localizeApiError(error, language.value, t, t('pubUpdateFailed'));
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div>
    <TopicPath :items="[
      { label: t('home'), to: '/' },
      { label: t('studio'), to: '/studio' },
      { label: t('studioPublicationManagement') },
    ]" />
    <ReaderPanel>
      <div class="publication-header">
        <h1>{{ t('studioPublicationManagement') }}</h1>
        <NuxtLink to="/studio">{{ t('pubBackToEdit') }}</NuxtLink>
      </div>
      <p v-if="authPending" role="status">{{ t('studioAuthChecking') }}</p>
      <div v-else-if="!auth?.configured" role="alert">{{ t('pubAuthNotConfigured') }}</div>
      <div v-else-if="!auth.authenticated" role="alert">
        <p>{{ t('pubLoginRequired') }}</p>
        <a href="/api/auth/discord">{{ t('studioDiscordLogin') }}</a>
      </div>
      <template v-else>
        <div class="publication-filters">
          <label>{{ t('searchSelectSeries') }}
            <select :value="selectedSeriesId" :disabled="loading || !!busyId" @change="changeSeries">
              <option value="">{{ t('searchSelectSeries') }}</option>
              <option v-for="series in seriesList" :key="series.id" :value="series.id">{{ series.draft.title }}</option>
            </select>
          </label>
          <label>{{ t('pubSectionLabel') }}
            <select v-model="section" :disabled="!selectedSeriesId">
              <option value="series">{{ t('studioKindSeries') }}</option>
              <option value="stories">{{ t('pubStories') }}</option>
              <option value="tips">{{ t('tips') }}</option>
              <option value="dictionaries">{{ t('dictionaries') }}</option>
              <option value="timeline">{{ t('timeline') }}</option>
            </select>
          </label>
          <label>{{ t('pubVisibilityLabel') }}
            <select v-model="statusFilter">
              <option value="all">{{ t('studioFilterAll') }}</option>
              <option value="visible">{{ t('pubVisible') }}</option>
              <option value="hidden">{{ t('pubHidden') }}</option>
              <option value="unpublished">{{ t('pubNoSnapshot') }}</option>
            </select>
          </label>
          <label>{{ t('pubSearchLabel') }}
            <input v-model="search" type="search" :placeholder="t('pubSearchPlaceholder')" />
          </label>
        </div>
        <div class="publication-toolbar">
          <p>{{ t('pubResultsLabel') }} {{ filtered.length }} {{ t('pubResultsUnit') }}</p>
          <div class="batch-toolbar">
            <button type="button" class="inline-action" :disabled="!!busyId" @click="batchSelection=filtered.map(n=>n.id)">{{ t('pubBatchSelectAll') }}</button>
            <button type="button" class="inline-action" :disabled="!!busyId||!batchSelection.length" @click="updateBatch('publish')">{{ t('pubBatchPublish') }}</button>
            <button type="button" class="inline-action" :disabled="!!busyId||!batchSelection.length" @click="updateBatch('show')">{{ t('pubBatchShow') }}</button>
            <button type="button" class="inline-action" :disabled="!!busyId||!batchSelection.length" @click="updateBatch('hide')">{{ t('pubBatchHide') }}</button>
          </div>
          <button type="button" class="inline-action" :disabled="loading || !!busyId" @click="load">{{ t('studioReload') }}</button>
        </div>
        <p v-if="successText" role="status">{{ successText }}</p>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <p v-if="loading" role="status">{{ t('pubLoading') }}</p>
        <p v-else-if="!selectedSeriesId" class="note">{{ t('searchChooseSeries') }}</p>
        <p v-else-if="!filtered.length">{{ t('pubEmpty') }}</p>
        <ul v-else class="publication-list">
          <li v-for="node in filtered" :key="node.id">
            <div class="publication-row">
              <label class="batch-check"><input v-model="batchSelection" type="checkbox" :value="node.id" :disabled="!!busyId" :aria-label="node.draft.title" /></label>
              <div class="publication-summary">
                <span class="note">{{ types[node.kind] }} · {{ status(node) }}</span>
                <h2>{{ node.draft.title }}</h2>
                <p class="note publication-path">{{ pathTitle(node) }}</p>
                <p class="note">
                  {{ t('pubSelfLabel') }}{{ node.isPublic ? t('pubPublic') : t('pubPrivate') }} ／ {{ t('pubSnapshotLabel') }}{{ node.published ? t('pubYes') : t('pubNo') }}
                  ／ {{ t('pubDateLabel') }}{{ node.publicSince === null ? t('pubUnset') : formatJstDisplay(node.publicSince, language) }}
                </p>
              </div>
              <div class="publication-actions">
                <button type="button" class="inline-action" :disabled="!!busyId" @click="action(node, 'publish')">
                  {{ t('pubUpdateSnapshot') }}
                </button>
                <button type="button" class="inline-action" :disabled="!!busyId" @click="action(node, 'visibility')">
                  {{ node.isPublic ? t('studioHide') : t('pubMakePublic') }}
                </button>
                <label class="schedule-field">{{ t('studioPublicStartDate') }} — {{ t('pubJstZoneNote') }}
                  <input v-model="scheduled[node.id]" type="datetime-local" :disabled="!!busyId || !node.published" />
                </label>
                <button type="button" class="inline-action" :disabled="!!busyId || !node.published" @click="saveSchedule(node)">
                  {{ t('pubSaveDate') }}
                </button>
                <NuxtLink :to="editorPath(node)">{{ t('pubEdit') }}</NuxtLink>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.publication-header,.publication-toolbar,.publication-row { display:flex;justify-content:space-between;gap:1rem;align-items:flex-start; }
.publication-row { display:grid;grid-template-columns:2rem minmax(13rem,1fr) minmax(17rem,1.5fr);align-items:start;gap:1rem; }
.batch-check { margin:.4rem 0; }
.batch-toolbar { display:flex;flex-wrap:wrap;gap:.3rem; }
@media (max-width:950px) { .publication-row {grid-template-columns:2rem minmax(0,1fr);} .publication-actions{grid-column:2;} }
.publication-header { align-items:center; }
.publication-filters { display:flex;flex-wrap:wrap;gap:.8rem;margin:1.25rem 0; }
.publication-filters label { flex:1 1 11rem;min-width:0; }
.publication-filters input,.publication-filters select {
  display:block;width:100%;margin-top:.4rem;padding:.55rem;
  color:var(--color-text-base);background:var(--color-background-input);
  border:1px solid var(--color-border-base);border-radius:var(--radius-input);
}
.publication-list { list-style:none;margin:1rem 0;padding:0; }
.publication-list li { border-top:1px solid var(--color-border-base);padding:1rem 0; }
.publication-summary { min-width:0;flex:1 1 18rem; }
.publication-summary h2 { font-size:1.15rem;margin:.3rem 0;overflow-wrap:anywhere; }
.publication-path { overflow-wrap:anywhere; }
.schedule-field { display:block;font-size:.8rem; }
.schedule-field input { margin-top:.25rem;width:auto;max-width:100%; }
.publication-actions { display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:flex-end;flex:1 1 28rem;min-width:0; }
@media (max-width:740px) {
  .publication-row { flex-direction:column; }
  .publication-actions { justify-content:flex-start; }
}
</style>
