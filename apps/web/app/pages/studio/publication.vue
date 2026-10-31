<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
import type { ReaderKind } from '~/types/reader';
const { t } = useUiLocale();

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } = await useFetch<AuthState>('/api/auth/me');
const nodes = ref<AuthorNode[]>([]);
const loading = ref(false);
const busyId = ref<string | null>(null);
const errorText = ref('');
const successText = ref('');
const section = ref('all');
const statusFilter = ref('all');
const search = ref('');
const scheduled = reactive<Record<string, string>>({});
function localDateTime(ms: number): string {
  const date = new Date(ms);
  return new Date(ms - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const types: Record<ReaderKind, string> = {
  series: t('studioKindSeries'), volume: t('studioKindVolume'), part: t('studioKindPart'), chapter: t('chapter'),
  category: t('studioKindCategory'), tip: t('tip'), tipSection: t('tipSection'),
  language: t('studioKindLanguage'), word: t('word'), grammar: t('grammar'),
  periodization: t('studioKindPeriodization'), event: t('event'),
};
const sections: Record<string, ReaderKind[]> = {
  all: Object.keys(types) as ReaderKind[],
  stories: ['series', 'volume', 'part', 'chapter'],
  tips: ['series', 'category', 'tip', 'tipSection'],
  dictionaries: ['series', 'language', 'word', 'grammar'],
  timeline: ['series', 'periodization', 'event'],
};
const byId = computed(() => new Map(nodes.value.map(node => [node.id, node])));
const kindOrder: Record<ReaderKind, number> = {
  series: 0, volume: 0, part: 0, chapter: 0,
  category: 1, tip: 0, tipSection: 0,
  language: 2, word: 0, grammar: 1,
  periodization: 3, event: 0,
};
function ancestry(node: AuthorNode): AuthorNode[] {
  const path: AuthorNode[] = [];
  const visited = new Set<string>();
  let current: AuthorNode | undefined = node;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.value.get(current.parentId) : undefined;
  }
  return path;
}
function published(node: AuthorNode): boolean {
  const now = Date.now();
  return ancestry(node).every(item =>
    item.published !== null && item.isPublic && item.publicSince !== null && item.publicSince <= now);
}
function status(node: AuthorNode): string {
  if (!node.published) return t('pubNoSnapshot');
  if (!node.isPublic) return t('pubSelfPrivate');
  if (node.publicSince === null) return t('pubDateUnset');
  if (node.publicSince > Date.now()) return t('pubPending');
  const blocked = ancestry(node).slice(0, -1).find(item =>
    !item.published || !item.isPublic || item.publicSince === null || item.publicSince > Date.now());
  return blocked ? t('pubAncestorPrivate') : t('pubVisible');
}
const filtered = computed(() => nodes.value.filter(node => {
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
      scheduled[node.id] = node.publicSince === null ? '' : localDateTime(node.publicSince);
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
  if (auth.value?.authenticated) await load();
});
async function saveSchedule(node: AuthorNode) {
  if (busyId.value || !node.published) return;
  const input = scheduled[node.id];
  // Empty means clear the future schedule. The domain visibility contract
  // normalizes null to the current time for an already-published public item.
  const time = input ? new Date(input).getTime() : null;
  if (time !== null && (!Number.isSafeInteger(time) || time < 0)) {
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
  if (kind === 'publish' && !window.confirm(t('pubPublishConfirm'))) return;
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
    const response = error as { data?: { message?: string | string[] }; statusCode?: number };
    const message = response.data?.message;
    errorText.value = Array.isArray(message) ? message.join(' / ') :
      typeof message === 'string' ? message : t('pubUpdateFailed');
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
          <label>{{ t('pubSectionLabel') }}
            <select v-model="section">
              <option value="all">{{ t('studioFilterAll') }}</option>
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
          <button type="button" class="inline-action" :disabled="loading || !!busyId" @click="load">{{ t('studioReload') }}</button>
        </div>
        <p v-if="successText" role="status">{{ successText }}</p>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <p v-if="loading" role="status">{{ t('pubLoading') }}</p>
        <p v-else-if="!filtered.length">{{ t('pubEmpty') }}</p>
        <ul v-else class="publication-list">
          <li v-for="node in filtered" :key="node.id">
            <div class="publication-row">
              <div class="publication-summary">
                <span class="note">{{ types[node.kind] }} · {{ status(node) }}</span>
                <h2>{{ node.draft.title }}</h2>
                <p class="note publication-path">{{ pathTitle(node) }}</p>
                <p class="note">
                  {{ t('pubSelfLabel') }}{{ node.isPublic ? t('pubPublic') : t('pubPrivate') }} ／ {{ t('pubSnapshotLabel') }}{{ node.published ? t('pubYes') : t('pubNo') }}
                  ／ {{ t('pubDateLabel') }}{{ node.publicSince === null ? t('pubUnset') : new Date(node.publicSince).toLocaleString('ja-JP') }}
                </p>
              </div>
              <div class="publication-actions">
                <button type="button" class="inline-action" :disabled="!!busyId" @click="action(node, 'publish')">
                  {{ t('pubUpdateSnapshot') }}
                </button>
                <button type="button" class="inline-action" :disabled="!!busyId" @click="action(node, 'visibility')">
                  {{ node.isPublic ? t('studioHide') : t('pubMakePublic') }}
                </button>
                <label class="schedule-field">{{ t('studioPublicStartDate') }}
                  <input v-model="scheduled[node.id]" type="datetime-local" :disabled="!!busyId || !node.published" />
                </label>
                <button type="button" class="inline-action" :disabled="!!busyId || !node.published" @click="saveSchedule(node)">
                  {{ t('pubSaveDate') }}
                </button>
                <NuxtLink :to="{ path: '/studio', query: { item: node.id } }">{{ t('pubEdit') }}</NuxtLink>
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
.publication-summary { min-width:0; }
.publication-summary h2 { font-size:1.15rem;margin:.3rem 0;overflow-wrap:anywhere; }
.publication-path { overflow-wrap:anywhere; }
.schedule-field { display:block;font-size:.8rem; }
.schedule-field input { margin-top:.25rem;width:auto;max-width:100%; }
.publication-actions { display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:flex-end;flex:0 0 auto; }
@media (max-width:740px) {
  .publication-row { flex-direction:column; }
  .publication-actions { justify-content:flex-start; }
}
</style>
