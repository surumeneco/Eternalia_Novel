<script setup lang="ts">
import { localizeApiError } from '~/utils/api-error-localization';
const { t, language } = useUiLocale();
const { confirm: showConfirmation } = useAppDialog();
interface Memo {
  id: string;
  title: string;
  body: string;
  tags: string[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}
interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } = await useFetch<AuthState>('/api/auth/me');
const memos = ref<Memo[]>([]);
const loading = ref(false);
const busy = ref(false);
const selectedId = ref<string | null>(null);
const newMemo = ref(false);
const search = ref('');
const title = ref('');
const body = ref('');
interface TagEntry { id: string; group: string; name: string; order: number; }
const tagCatalog = ref<TagEntry[]>([]);
const tagIds = ref<string[]>([]);
const selectedTagId = ref('');
const catalogNames = computed(() => new Map(tagCatalog.value.map(tag => [tag.id,tag.name])));
const availableTags = computed(() => tagCatalog.value.filter(tag => !tagIds.value.includes(tag.id)));
const localized = (ja: string, en: string) => language.value === 'en' ? en : ja;
function addTag() {
  if (selectedTagId.value && availableTags.value.some(tag => tag.id === selectedTagId.value)) {
    tagIds.value = [...tagIds.value, selectedTagId.value];
    selectedTagId.value = '';
  }
}
function removeTag(id: string) { tagIds.value = tagIds.value.filter(value => value !== id); }
const errorText = ref('');
const statusText = ref('');
const selected = computed(() => memos.value.find(memo => memo.id === selectedId.value) ?? null);
const dirty = computed(() =>
  (newMemo.value || selected.value !== null) && (
    title.value !== (newMemo.value ? '' : selected.value?.title ?? '') ||
    body.value !== (newMemo.value ? '' : selected.value?.body ?? '') ||
    tagIds.value.join('\u0000') !== (newMemo.value ? '' : (selected.value?.tags ?? []).join('\u0000'))
  ),
);
const visibleMemos = computed(() => memos.value.filter(memo =>
  !search.value.trim() || [memo.title,memo.body,...memo.tags.map(id => catalogNames.value.get(id) ?? id)]
    .some(value => value.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())),
));
async function confirmDiscard() {
  return !dirty.value || await showConfirmation(t('memoDiscardConfirm'));
}
function applySelected() {
  title.value = newMemo.value ? '' : selected.value?.title ?? '';
  body.value = newMemo.value ? '' : selected.value?.body ?? '';
  tagIds.value = newMemo.value ? [] : [...(selected.value?.tags ?? [])];
  selectedTagId.value = '';
}
async function selectMemo(id: string) {
  if (busy.value) return;
  if (id === selectedId.value && !newMemo.value) return;
  if (!await confirmDiscard()) return;
  newMemo.value = false;
  selectedId.value = id;
  applySelected();
  errorText.value = '';
  statusText.value = '';
}
async function startNew() {
  if (busy.value || !await confirmDiscard()) return;
  newMemo.value = true;
  selectedId.value = null;
  applySelected();
  errorText.value = '';
  statusText.value = '';
}
async function load(): Promise<boolean> {
  if (!auth.value?.authenticated) return false;
  loading.value = true;
  try {
    const [records, catalog] = await Promise.all([
      $fetch<Memo[]>('/api/admin/memos'),
      $fetch<TagEntry[]>('/api/admin/masters/tags'),
    ]);
    memos.value = records;
    tagCatalog.value = catalog;
    if (selectedId.value && !memos.value.some(memo => memo.id === selectedId.value)) {
      selectedId.value = null;
    }
    applySelected();
    return true;
  } catch {
    errorText.value = t('memoLoadError');
    return false;
  } finally { loading.value = false; }
}
function tags(): string[] { return [...tagIds.value]; }
async function save() {
  if (busy.value) return;
  if (!title.value.trim()) { errorText.value = t('studioCreateTitleRequired'); return; }
  busy.value = true;
  errorText.value = '';
  statusText.value = '';
  try {
    const content = { title:title.value,body:body.value,tags:tags() };
    const result = newMemo.value
      ? await $fetch<Memo>('/api/admin/memos', { method:'POST',body:content })
      : await $fetch<Memo>('/api/admin/memos/' + encodeURIComponent(selectedId.value ?? ''), {
        method:'PATCH',
        body:{...content,expectedRevision:selected.value?.revision},
      });
    newMemo.value = false;
    selectedId.value = result.id;
    // Do not acknowledge a verified save until the latest memo is readable.
    if (await load()) statusText.value = t('memoSaved');
  } catch (error: unknown) {
    errorText.value = localizeApiError(error, language.value, t, t('memoSaveFailed'));
  } finally { busy.value = false; }
}
async function reload() {
  if (!busy.value && await confirmDiscard()) await load();
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = '';
}
onBeforeRouteLeave(() => confirmDiscard());
onMounted(async () => {
  await refreshAuth();
  window.addEventListener('beforeunload',beforeUnload);
  if (auth.value?.authenticated) await load();
});
onBeforeUnmount(() => window.removeEventListener('beforeunload',beforeUnload));
</script>

<template>
  <div>
    <TopicPath :items="[{label:t('home'),to:'/'},{label:t('studio'),to:'/studio'},{label:t('studioMemos')}]" />
    <ReaderPanel>
      <h1>{{ t('studioMemos') }}</h1>
      <p v-if="authPending" role="status">{{ t('memoAuthChecking') }}</p>
      <div v-else-if="!auth?.authenticated" role="alert">
        <p>{{ t('memoLoginRequired') }}</p>
        <a v-if="auth?.configured" href="/api/auth/discord">{{ t('studioDiscordLogin') }}</a>
      </div>
      <template v-else>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <p v-if="statusText" role="status">{{ statusText }}</p>
        <div class="memo-grid">
          <aside class="memo-sidebar">
            <div class="memo-actions">
              <button type="button" class="inline-action" :disabled="busy || loading" @click="startNew">{{ t('memoNew') }}</button>
              <button type="button" class="inline-action" :disabled="loading || busy" @click="reload">{{ t('studioReload') }}</button>
            </div>
            <label>{{ t('memoSearch') }}
              <input v-model="search" type="search" :placeholder="t('memoSearchPlaceholder')" />
            </label>
            <p v-if="loading" role="status">{{ t('loading') }}</p>
            <ul v-else class="memo-list">
              <li v-for="memo in visibleMemos" :key="memo.id">
                <button type="button" :disabled="busy || loading" :aria-pressed="selectedId === memo.id && !newMemo" @click="selectMemo(memo.id)">
                  {{ memo.title }}
                  <span class="note">{{ new Date(memo.updatedAt).toLocaleDateString('ja-JP') }}</span>
                </button>
              </li>
            </ul>
            <p v-if="!loading && !visibleMemos.length" class="note">{{ t('memoEmpty') }}</p>
          </aside>
          <section class="memo-editor">
            <form v-if="newMemo || selected" @submit.prevent="save">
              <h2>{{ newMemo ? t('memoNew') : t('memoEdit') }}</h2>
              <label>{{ t('studioTitleLabel') }} <input v-model="title" maxlength="150" required /></label>
              <label>{{ t('memoBody') }} <textarea v-model="body" rows="14" maxlength="100000" /></label>
              <div class="memo-tag-selector">
                <label>{{ t('memoTags') }}
                  <select v-model="selectedTagId" :aria-label="t('memoTags')">
                    <option value="">{{ t('tipSelect') }}</option>
                    <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
                      {{ tag.group }} / {{ tag.name }}
                    </option>
                  </select>
                </label>
                <button type="button" class="inline-action" :disabled="!selectedTagId" @click="addTag">
                  {{ localized('タグを追加', 'Add tag') }}
                </button>
                <ul class="memo-tag-list">
                  <li v-for="id in tagIds" :key="id">
                    <span>{{ catalogNames.get(id) ?? id }}</span>
                    <button type="button" class="inline-action"
                      :aria-label="(catalogNames.get(id) ?? id) + t('tipRemoveSuffix')"
                      @click="removeTag(id)">{{ t('tipRemove') }}</button>
                  </li>
                </ul>
                <p class="note">
                  {{ localized('タグは共通マスタから選択します。', 'Tags are selected from the shared catalog.') }}
                  <NuxtLink to="/admin/masters/tags">{{ t('tagMaster') }}</NuxtLink>
                </p>
              </div>
              <p v-if="selected && !newMemo" class="note">{{ t('memoRevision') }} {{ selected.revision }}</p>
              <button type="submit" class="primary" :disabled="busy">{{ t('memoSave') }}</button>
            </form>
            <p v-else>{{ t('memoChoose') }}</p>
          </section>
        </div>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.memo-grid { display:grid;grid-template-columns:minmax(200px,290px) minmax(0,1fr);gap:1rem;margin-top:1rem; }
.memo-sidebar,.memo-editor { min-width:0;padding:1rem;background:var(--color-background-soft);border:1px solid var(--color-border-base);border-radius:var(--radius-panel); }
.memo-actions { display:flex;flex-wrap:wrap;gap:.5rem; }
.memo-list { list-style:none;padding:0;max-height:70vh;overflow:auto; }
.memo-list button { width:100%;text-align:left;background:transparent;border:0;color:var(--color-text-base);padding:.5rem;overflow-wrap:anywhere; }
.memo-list button[aria-pressed="true"] { background:#005f7f; }
.memo-list .note { display:block;font-size:var(--font-size-xs); }
label { display:block;margin:1rem 0; }
input,textarea,select { display:block;width:100%;min-width:0;margin-top:.4rem;padding:.6rem;background:var(--color-background-input);color:var(--color-text-base);border:1px solid var(--color-border-base);border-radius:var(--radius-input); }
textarea { min-height:10rem;resize:vertical; }
.memo-tag-selector{margin-block:1rem;}
.memo-tag-list{list-style:none;padding:0;display:flex;gap:.5rem;flex-wrap:wrap;}
.memo-tag-list li{display:flex;align-items:center;gap:.35rem;}
.primary { padding:.45rem .8rem;background:#00698c;border:1px solid var(--color-concept-main);color:#fff; }
@media (max-width:800px) { .memo-grid { grid-template-columns:minmax(0,1fr); } }
</style>
