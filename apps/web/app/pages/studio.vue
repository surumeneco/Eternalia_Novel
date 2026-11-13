<script setup lang="ts">
import type { AuthorNode } from '~/types/author';
const { t } = useUiLocale();
const studioRoute = useRoute();
import type { ReaderKind } from '~/types/reader';
import { parseLanguageWordClasses, diagnoseWordSpelling, appendDuplicateWordMeaning, pagesForChapter, joinChapterPages } from '@eternalia/contracts';
import { insertManuscriptMarkup, type ManuscriptInsertionKind } from '~/utils/manuscript-markup';
import { chapterRecoveryKey, chapterRecoveryMatches, chapterRecoveryPrefix, isAutosaveRevisionConflict, parseChapterRecovery, type ChapterRecovery } from '~/utils/chapter-autosave';

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } =
  await useFetch<AuthState>('/api/auth/me');

const kinds: Record<ReaderKind, string> = {
  series: t('studioKindSeries'), volume: t('studioKindVolume'), part: t('studioKindPart'), chapter: t('chapter'),
  category: t('studioKindCategory'), tip: t('tip'), tipSection: t('tipSection'),
  language: t('studioKindLanguage'), word: t('word'), grammar: t('grammar'),
  periodization: t('studioKindPeriodization'), event: t('event'),
};
const children: Record<ReaderKind | 'root', ReaderKind[]> = {
  root: ['series'],
  series: ['volume', 'category', 'language', 'periodization'],
  volume: ['part'], part: ['chapter'], chapter: [],
  category: ['tip'], tip: ['tipSection'], tipSection: [],
  language: ['word', 'grammar'], word: [], grammar: [],
  periodization: ['event'], event: [],
};
const filters = {
  all: { label: t('studioFilterAll'), kinds: Object.keys(kinds) as ReaderKind[] },
  stories: { label: t('studioFilterStories'), kinds: ['series','volume','part','chapter'] as ReaderKind[] },
  tips: { label: t('studioFilterTips'), kinds: ['series','category','tip','tipSection'] as ReaderKind[] },
  dictionaries: { label: t('studioFilterDictionaries'), kinds: ['series','language','word','grammar'] as ReaderKind[] },
  timeline: { label: t('studioFilterTimeline'), kinds: ['series','periodization','event'] as ReaderKind[] },
};
type Filter = keyof typeof filters;

const nodes = ref<AuthorNode[]>([]);
const selectedId = ref<string | null>(null);
const selected = computed(() => nodes.value.find(n => n.id === selectedId.value) ?? null);
const moveCategoryTarget = ref('');
const movableCategories = computed(() => {
  const tip = selected.value;
  if (tip?.kind !== 'tip') return [];
  const origin = nodes.value.find(n => n.id === tip.parentId);
  if (origin?.kind !== 'category') return [];
  return nodes.value.filter(n => n.kind === 'category' && n.parentId === origin.parentId);
});
watch(() => selected.value?.parentId, parent => { moveCategoryTarget.value = parent ?? ''; }, { immediate: true });
const publicationStatus = computed(() => !selected.value?.published ? t('studioUnpublished')
  : selected.value.isPublic ? t('studioPublishedState') : t('studioPrivateState'));
const filter = ref<Filter>('all');
const busy = ref(false);
const errorText = ref('');
const statusText = ref('');
const form = reactive<{ title:string; body:string; details:Record<string,string> }>({
  title:'',body:'',details:{},
});
const bodyTextarea = ref<HTMLTextAreaElement | null>(null);
const composingBody = ref(false);
const autosavingChapter = ref(false);
const autosaveStatus = ref<'idle'|'pending'|'saved'|'failed'|'conflict'>('idle');
const chapterRecovery = ref<ChapterRecovery | null>(null);
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let autosaveConflict = false;
function cancelAutosaveTimer() {
  if (autosaveTimer !== null) clearTimeout(autosaveTimer);
  autosaveTimer = null;
}
function recoveryFromTab(nodeId: string): ChapterRecovery | null {
  if (typeof sessionStorage === 'undefined') return null;
  try { return parseChapterRecovery(sessionStorage.getItem(chapterRecoveryKey(nodeId)), nodeId); }
  catch { return null; }
}
function clearChapterRecovery(nodeId: string) {
  if (typeof sessionStorage === 'undefined') return;
  try { sessionStorage.removeItem(chapterRecoveryKey(nodeId)); } catch { /* storage unavailable */ }
  if (chapterRecovery.value?.nodeId === nodeId) chapterRecovery.value = null;
}
function persistChapterRecovery() {
  const node = selected.value;
  if (typeof sessionStorage === 'undefined' || !auth.value?.authenticated || node?.kind !== 'chapter') return;
  if (!editorDirty.value) return;
  const previous = recoveryFromTab(node.id);
  const state: ChapterRecovery = {
    version: 1, nodeId: node.id,
    baseRevision: autosaveConflict && previous ? previous.baseRevision : node.revision,
    savedAt: Date.now(), title: form.title,
    pages: [...chapterPages.value], details: { ...form.details },
  };
  try { sessionStorage.setItem(chapterRecoveryKey(node.id), JSON.stringify(state)); }
  catch { /* Server autosave still runs if tab storage is unavailable. */ }
}
function showRecoveryIfPresent() {
  const node = selected.value;
  chapterRecovery.value = node?.kind === 'chapter' && auth.value?.authenticated
    ? recoveryFromTab(node.id) : null;
  if (node?.kind === 'chapter' && chapterRecovery.value &&
      chapterRecoveryMatches(chapterRecovery.value, {
        title: node.draft.title, pages: pagesForChapter(node.draft), details: node.draft.details ?? {},
      })) clearChapterRecovery(node.id);
  autosaveConflict = false;
  autosaveStatus.value = 'idle';
}
function restoreChapterRecovery() {
  const recovery = chapterRecovery.value;
  const node = selected.value;
  if (!recovery || !node || node.kind !== 'chapter' || node.id !== recovery.nodeId) return;
  form.title = recovery.title;
  form.details = { ...recovery.details };
  chapterPages.value = [...recovery.pages];
  selectedPage.value = 0;
  chapterRecovery.value = null;
  // Never silently overwrite a newer server draft with recovered tab data.
  if (recovery.baseRevision !== node.revision) {
    autosaveConflict = true;
    autosaveStatus.value = 'conflict';
  } else scheduleChapterAutosave();
}
function scheduleChapterAutosave(delayMs = 1500) {
  cancelAutosaveTimer();
  if (autosaveConflict || busy.value || autosavingChapter.value || composingBody.value ||
      !auth.value?.authenticated || selected.value?.kind !== 'chapter' || !editorDirty.value) return;
  autosaveStatus.value = 'pending';
  autosaveTimer = setTimeout(() => { autosaveTimer = null; void autosaveChapter(); }, delayMs);
}
async function autosaveChapter() {
  const node = selected.value;
  if (!node || node.kind !== 'chapter' || !editorDirty.value || autosavingChapter.value ||
      busy.value || composingBody.value || autosaveConflict || !auth.value?.authenticated) return;
  if (chapterPages.value.length > 1000 || chapterBodyLength.value > 100000) {
    autosaveStatus.value = 'failed';
    errorText.value = t('studioBodyTooLong');
    return;
  }
  const nodeId = node.id;
  const content = {
    title: form.title, body: joinChapterPages(chapterPages.value),
    pages: [...chapterPages.value], details: { ...form.details },
  };
  persistChapterRecovery();
  autosavingChapter.value = true;
  autosaveStatus.value = 'pending';
  let success = false;
  try {
    await $fetch('/api/admin/nodes/' + nodeId, {
      method: 'PATCH', body: { expectedRevision: node.revision, content },
    });
    // A successful PATCH without readback is not proof of the current revision.
    if (!await load()) throw new Error('post-save-readback-failed');
    success = true;
    if (selected.value?.id === nodeId && !editorDirty.value) {
      clearChapterRecovery(nodeId);
      autosaveStatus.value = 'saved';
    }
  } catch (error: unknown) {
    autosaveStatus.value = isAutosaveRevisionConflict(error) ? 'conflict' : 'failed';
    if (autosaveStatus.value === 'conflict') autosaveConflict = true;
    errorText.value = autosaveStatus.value === 'conflict'
      ? t('studioAutosaveConflict') : t('studioAutosaveFailure');
  } finally {
    autosavingChapter.value = false;
    if (success && selected.value?.id === nodeId && editorDirty.value) scheduleChapterAutosave();
  }
}
function retryChapterAutosave() {
  if (!autosaveConflict && autosaveStatus.value === 'failed') scheduleChapterAutosave(0);
}
function clearAllChapterRecoveries() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith(chapterRecoveryPrefix));
    for (const key of keys) sessionStorage.removeItem(key);
  } catch { /* storage unavailable */ }
  chapterRecovery.value = null;
}

const chapterPages = ref<string[]>(['']);
const selectedPage = ref(0);
const selectedPageBody = computed<string>({
  get: () => chapterPages.value[selectedPage.value] ?? '',
  set: value => { chapterPages.value[selectedPage.value] = value; },
});
const chapterBodyLength = computed(() => joinChapterPages(chapterPages.value).length);
function jumpPage(index: number) {
  if (busy.value || composingBody.value || index < 0 || index >= chapterPages.value.length) return;
  selectedPage.value = index;
  nextTick(() => bodyTextarea.value?.focus());
}
function addPageAfter() {
  if (busy.value || composingBody.value || chapterPages.value.length >= 1000 ||
      chapterBodyLength.value + '[[page]]'.length > 100000) {
    errorText.value = t('studioBodyTooLong');
    return;
  }
  chapterPages.value.splice(selectedPage.value + 1, 0, '');
  selectedPage.value++;
  errorText.value = '';
  nextTick(() => bodyTextarea.value?.focus());
}
function reorderPage(delta: number) {
  if (busy.value || composingBody.value) return;
  const current = selectedPage.value, next = current + delta;
  if (next < 0 || next >= chapterPages.value.length) return;
  // Move complete page values, never recreate them from substrings or a marker.
  const [page] = chapterPages.value.splice(current, 1);
  chapterPages.value.splice(next, 0, page ?? '');
  selectedPage.value = next;
  nextTick(() => bodyTextarea.value?.focus());
}
function insertMarkup(kind: ManuscriptInsertionKind) {
  const el = bodyTextarea.value;
  if (!el || composingBody.value || busy.value) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const body = selectedPageBody.value;
  const result = insertManuscriptMarkup(body, start, end, kind);
  if (!result) {
    errorText.value = t('studioRubyInvalid');
    return;
  }
  if (chapterBodyLength.value - body.length + result.value.length > 100000) {
    errorText.value = t('studioBodyTooLong');
    return;
  }
  // A direct v-model assignment (and setRangeText) bypasses the browser's
  // native Undo history. insertText preserves a single undoable edit in
  // Chromium; retain a value fallback for browsers where it is unavailable.
  const replaceEnd = end;
  const insertedText = result.value.slice(start, result.value.length - (body.length - replaceEnd));
  el.focus();
  el.setSelectionRange(start, replaceEnd);
  let nativeInserted = false;
  try {
    nativeInserted = document.execCommand('insertText', false, insertedText);
  } catch { /* Unsupported editing command; use the model fallback below. */ }
  selectedPageBody.value = nativeInserted && el.value === result.value ? el.value : result.value;
  errorText.value = '';
  nextTick(() => {
    const current = bodyTextarea.value;
    if (!current) return;
    current.focus();
    current.setSelectionRange(result.selectionStart, result.selectionEnd);
  });
}
const categoryPresets = computed<string>({
  get: () => form.details.presets ?? '[]',
  set: value => { form.details.presets = value; },
});
const tipTags = computed<string>({
  get: () => form.details.tags ?? '[]',
  set: value => { form.details.tags = value; },
});
const tipRelatedTipIds = computed<string>({
  get: () => form.details.relatedTipIds ?? '[]',
  set: value => { form.details.relatedTipIds = value; },
});
const wordMeanings = computed<string>({
  get: () => form.details.meanings ?? '[]',
  set: value => { form.details.meanings = value; },
});
const languageCharacters = computed<string>({
  get: () => form.details.characters ?? '[]',
  set: value => { form.details.characters = value; },
});
const languageWordClasses = computed<string>({
  get: () => form.details.wordClasses ?? '[]',
  set: value => { form.details.wordClasses = value; },
});
const createOpen = ref(false);
const createParentId = ref<string | null>(null);
const createKind = ref<ReaderKind>('series');
const createTitle = ref('');
const createWordIsPublic = ref(true);
const createWordPartOfSpeech = ref('');
const createWordDefinition = ref('');
const editorDirty = computed(() => {
  const draft = selected.value?.draft;
  if (!draft) return false;
  const currentDetails = form.details;
  const originalDetails = draft.details ?? {};
  const detailKeys = new Set([...Object.keys(currentDetails), ...Object.keys(originalDetails)]);
  const bodyDirty = selected.value?.kind === 'chapter'
    ? JSON.stringify(chapterPages.value) !== JSON.stringify(pagesForChapter(draft))
    : form.body !== draft.body;
  return form.title !== draft.title || bodyDirty ||
    [...detailKeys].some(key => (currentDetails[key] ?? '') !== (originalDetails[key] ?? ''));
});
const creationDirty = computed(() => createOpen.value &&
  (createTitle.value.trim().length > 0 || (createKind.value === 'word' &&
    (!createWordIsPublic.value || createWordPartOfSpeech.value.length > 0 || createWordDefinition.value.length > 0))));
const hasUnsavedChanges = computed(() => editorDirty.value || creationDirty.value);
function confirmDiscard(): boolean {
  return !hasUnsavedChanges.value || window.confirm(t('studioUnsavedDiscard'));
}
function restoreEditor() {
  form.title = selected.value?.draft.title ?? '';
  form.body = selected.value?.draft.body ?? '';
  chapterPages.value = selected.value?.kind === 'chapter'
    ? pagesForChapter(selected.value.draft) : [''];
  selectedPage.value = 0;
  form.details = { ...(selected.value?.draft.details ?? {}) };
  showRecoveryIfPresent();
}
function selectNode(nodeId: string) {
  if (busy.value || autosavingChapter.value) return;
  if (selectedId.value === nodeId && !createOpen.value) return;
  if (!confirmDiscard()) return;
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  cancelAutosaveTimer();
  createOpen.value = false;
  selectedId.value = nodeId;
  restoreEditor();
}
function cancelCreate() {
  if (busy.value) return;
  if (creationDirty.value && !window.confirm(t('studioNewItemDiscard'))) return;
  createOpen.value = false;
  createTitle.value = '';
  createWordPartOfSpeech.value = '';
  createWordDefinition.value = '';
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return;
  event.preventDefault();
  event.returnValue = '';
}
onBeforeRouteLeave(() => {
  if (!confirmDiscard()) return false;
  cancelAutosaveTimer();
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
});
// /studio/child is a nested route: its parent stays mounted, so the leave
// guard alone does not protect unsaved editor input on child navigation.
onBeforeRouteUpdate((to, from) => {
  if (from.path !== '/studio' || to.fullPath === from.fullPath) return;
  if (!confirmDiscard()) return false;
  cancelAutosaveTimer();
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  createOpen.value = false;
  createTitle.value = '';
  restoreEditor();
});
onBeforeUnmount(() => {
  cancelAutosaveTimer();
  window.removeEventListener('beforeunload', beforeUnload);
  window.removeEventListener('online', retryChapterAutosave);
});

const creationChoices = computed(() =>
  children[createParentId.value ? nodes.value.find(n => n.id === createParentId.value)?.kind || 'root' : 'root']
);

const byId = computed(() => new Map(nodes.value.map(node => [node.id,node])));
const createWordClasses = computed(() => {
  const language = createParentId.value ? byId.value.get(createParentId.value) : null;
  if (language?.kind !== 'language') return [];
  try {
    return parseLanguageWordClasses(language.draft.details.wordClasses ?? '[]')
      .map(entry => ({ id: entry.id, title: entry.name }));
  } catch { return []; }
});
const activeWordLanguages = computed(() => {
  const language = selected.value?.parentId ? byId.value.get(selected.value.parentId) : null;
  return language?.kind === 'language'
    ? nodes.value.filter(node => node.kind === 'language' && node.parentId === language.parentId)
        .map(node => ({id:node.id,title:node.draft.title}))
    : [];
});
const activeWordClasses = computed(() => {
  const language = selected.value?.parentId ? byId.value.get(selected.value.parentId) : null;
  if (language?.kind !== 'language') return [];
  try {
    return parseLanguageWordClasses(language.draft.details.wordClasses ?? '[]')
      .map(entry => ({ id: entry.id, title: entry.name }));
  } catch { return []; }
});
const activeWordReferences = computed(() => {
  const languageIds = new Set(activeWordLanguages.value.map(node => node.id));
  return nodes.value.filter(node => node.kind === 'word' && node.parentId && languageIds.has(node.parentId))
    .map(node => ({id:node.id,title:node.draft.title,parentId:node.parentId}));
});
const spellingWarnings = computed(() => {
  if (selected.value?.kind !== 'word') return [];
  return diagnoseWordSpelling({ nodes: nodes.value }, selected.value.id, form.title);
});
const kindOrder: Record<ReaderKind, number> = {
  series: 0, volume: 0, part: 0, chapter: 0,
  category: 1, tip: 0, tipSection: 0,
  language: 2, word: 0, grammar: 1,
  periodization: 3, event: 0,
};
const ordered = computed(() => {
  const indexed = new Map<string | null,AuthorNode[]>();
  for (const node of nodes.value) {
    const bucket = indexed.get(node.parentId) ?? [];
    bucket.push(node);
    indexed.set(node.parentId,bucket);
  }
  for (const bucket of indexed.values()) bucket.sort((a,b) => kindOrder[a.kind] - kindOrder[b.kind] || a.order - b.order || a.draft.title.localeCompare(b.draft.title, 'ja'));
  const out: {node:AuthorNode; depth:number}[] = [];
  const visited = new Set<string>();
  function visit(parentId: string | null,depth:number) {
    for (const node of indexed.get(parentId) ?? []) {
      if (visited.has(node.id) || depth > 12) continue;
      visited.add(node.id);
      if (filters[filter.value].kinds.includes(node.kind)) out.push({node,depth});
      visit(node.id, depth+1);
    }
  }
  visit(null,0);
  return out;
});
// Refreshing the current node after publication must preserve the editing buffer.
// Loading a different item initializes that item's saved draft instead.
watch(() => selected.value?.id, () => { cancelAutosaveTimer(); restoreEditor(); }, { immediate: true });
// Watch the complete chapter form (including the page array), not just a dirty
// boolean that remains true through successive edits.
watch(() => JSON.stringify({ id: selectedId.value, title: form.title,
  pages: chapterPages.value, details: form.details }), () => {
  if (selected.value?.kind !== 'chapter' || !auth.value?.authenticated) return;
  if (editorDirty.value) {
    persistChapterRecovery();
    scheduleChapterAutosave();
  } else if (!autosavingChapter.value && !chapterRecovery.value) {
    clearChapterRecovery(selected.value.id);
  }
}, { flush: 'post' });


const scheduledLocal = ref('');
watch(selected, node => {
  scheduledLocal.value = node?.publicSince
    ? new Date(node.publicSince - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)
    : '';
}, { immediate: true });

async function load(): Promise<boolean> {
  try {
    nodes.value = await $fetch<AuthorNode[]>('/api/admin/nodes');
    if (!nodes.value.some(n => n.id === selectedId.value)) selectedId.value = null;
    errorText.value = '';
    return true;
  } catch (e: unknown) {
    errorText.value = t('studioLibraryLoadError');
    return false;
  }
}
onMounted(async () => {
  await refreshAuth();
  window.addEventListener('beforeunload', beforeUnload);
  if (auth.value?.authenticated) {
    await load();
    window.addEventListener('online', retryChapterAutosave);
    const requested = useRoute().query.item;
    if (typeof requested === 'string' && nodes.value.some(node => node.id === requested)) {
      selectedId.value = requested;
    }
  }
});
async function reloadNodes() {
  if (!confirmDiscard()) return;
  cancelAutosaveTimer();
  if (await load()) {
    if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
    restoreEditor();
  }
}

async function runChange(work: () => Promise<void>, okText:string, reloadAfter = true) {
  if (busy.value || autosavingChapter.value) return;
  cancelAutosaveTimer();
  busy.value = true; errorText.value=''; statusText.value='';
  try {
    await work();
    if (!reloadAfter || await load()) {
      statusText.value = okText;
      if (selected.value?.kind === 'chapter' && !editorDirty.value) {
        clearChapterRecovery(selected.value.id);
        autosaveConflict = false;
        autosaveStatus.value = 'saved';
      }
    } else {
      errorText.value = t('studioPostUpdateRefreshError');
    }
  } catch (e: unknown) {
    const info = e as { data?: { message?: string | string[] } };
    errorText.value = Array.isArray(info.data?.message)
      ? info.data.message.join(' / ')
      : info.data?.message || t('studioSaveError');
  } finally {
    busy.value = false;
    if (selected.value?.kind === 'chapter' && editorDirty.value) scheduleChapterAutosave();
  }
}
function openCreate(parentId: string | null) {
  if (busy.value || autosavingChapter.value || !confirmDiscard()) return;
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  cancelAutosaveTimer();
  restoreEditor();
  createParentId.value = parentId;
  const parent = parentId ? byId.value.get(parentId) : null;
  createKind.value = children[parent?.kind || 'root'][0] || 'series';
  createTitle.value = '';
  createWordIsPublic.value = true;
  createWordPartOfSpeech.value = '';
  createWordDefinition.value = '';
  createOpen.value = true;
}
async function createItem() {
  if (!createTitle.value.trim()) { errorText.value=t('studioCreateTitleRequired'); return; }
  const attempt = {
    partOfSpeech: createWordPartOfSpeech.value.trim(),
    definition: createWordDefinition.value.trim(),
  };
  const duplicateOutcome: { wordId: string | null } = { wordId: null };
  await runChange(async () => {
    let response: { id: string };
    try {
      response = await $fetch<{id:string}>('/api/admin/nodes', {
        method:'POST',
        body:{
          kind: createKind.value, parentId:createParentId.value,
          ...(createKind.value === 'word' ? { isPublic: createWordIsPublic.value } : {}),
          content:{
            title:createTitle.value.trim(), body:'',
            ...(createKind.value === 'chapter' ? { pages:[''] } : {}),
            details:createKind.value === 'category' ? { presets:'[]' } :
              createKind.value === 'word' ? { meanings: attempt.partOfSpeech || attempt.definition
                ? JSON.stringify([{id:crypto.randomUUID(),...attempt,etymologies:[]}]) : '[]' } :
              createKind.value === 'language' ? {characters:'[]',wordClasses:'[]'} : {},
          },
        },
      });
    } catch (error: unknown) {
      const value = error as { statusCode?: number; data?: {
        code?: string; existingWordId?: string } };
      if (createKind.value === 'word' && value.statusCode === 409 &&
          value.data?.code === 'duplicate-spelling' && value.data.existingWordId) {
        duplicateOutcome.wordId = value.data.existingWordId;
        return;
      }
      throw error;
    }
    createOpen.value = false;
    selectedId.value = response.id;
  }, t('studioCreated'));
  if (duplicateOutcome.wordId) {
    const existing = nodes.value.find(node => node.id === duplicateOutcome.wordId &&
      node.kind === 'word' && node.parentId === createParentId.value);
    if (!existing) {
      errorText.value = t('studioWordDuplicateNotFound');
      statusText.value = '';
      return;
    }
    // The rejected form is never saved. Only the local existing-word editor
    // gets the attempted meaning, after Vue has processed selection watchers.
    createOpen.value = false;
    selectedId.value = existing.id;
    await nextTick();
    restoreEditor();
    try {
      wordMeanings.value = appendDuplicateWordMeaning(form.details.meanings ?? '[]', {
        id: crypto.randomUUID(), ...attempt,
      });
      errorText.value = t('studioWordDuplicateRedirect');
    } catch (error: unknown) {
      errorText.value = t('studioWordDuplicateLimit');
    }
    statusText.value = '';
  }
}
async function saveDraft() {
  let node = selected.value;
  if (!node || autosavingChapter.value) return;
  if (node.kind === 'chapter' && autosaveConflict) {
    if (!window.confirm(t('studioAutosaveConflictConfirm'))) return;
    if (!await load()) return;
    node = selected.value;
    if (!node) return;
  }
  if (node.kind === 'chapter' && (chapterPages.value.length > 1000 || chapterBodyLength.value > 100000)) {
    errorText.value = t('studioBodyTooLong');
    return;
  }
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id, {
      method:'PATCH',
      body: { expectedRevision:node.revision,content:{
        title:form.title,
        body:node.kind === 'chapter' ? joinChapterPages(chapterPages.value) : form.body,
        ...(node.kind === 'chapter' ? { pages: [...chapterPages.value] } : {}),
        details:{...form.details},
      }},
    });
  }, t('studioDraftSaved'));
}
async function moveTipCategory() {
  const node = selected.value;
  if (!node || node.kind !== 'tip' || moveCategoryTarget.value === node.parentId) return;
  if (editorDirty.value) {
    errorText.value = t('studioMoveSaveFirst');
    return;
  }
  const categoryId = moveCategoryTarget.value;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id + '/move-category', {
      method: 'POST', body: { expectedRevision: node.revision, targetCategoryId: categoryId },
    });
  }, t('studioMoveCategorySaved'));
}
async function publish() {
  const node=selected.value;
  if (!node || !confirm(t('studioPublishConfirm'))) return;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id + '/publish',{
      method:'POST',body:{expectedRevision:node.revision},
    });
  }, t('studioPublished'));
}
async function changeVisibility(isPublic:boolean,publicSince:number | null) {
  const node=selected.value;
  if (!node) return;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id + '/visibility',{
      method:'POST',body:{expectedRevision:node.revision,isPublic,publicSince},
    });
  }, t('studioVisibilityChanged'));
}
async function schedule() {
  if (scheduledLocal.value && !Number.isFinite(new Date(scheduledLocal.value).getTime())) {
    errorText.value=t('studioInvalidDate'); return;
  }
  await changeVisibility(selected.value?.isPublic ?? false,
    scheduledLocal.value ? new Date(scheduledLocal.value).getTime() : null);
}
async function logout() {
  if (!confirmDiscard()) return;
  await runChange(async () => {
    await $fetch('/api/auth/logout',{method:'POST',body:{}});
    cancelAutosaveTimer();
    clearAllChapterRecoveries();
    selectedId.value=null;
    nodes.value=[];
    await refreshAuth();
  }, t('studioLoggedOut'), false);
}
</script>

<template>
  <NuxtPage v-if="studioRoute.matched.length > 1" />
  <div v-else>
    <TopicPath :items="[{label:t('home'),to:'/'},{label:t('studio')}]" />
    <ReaderPanel>
      <div class="studio-title">
        <div>
                     <h1>{{ t('studio') }}</h1>
          <p>{{ t('studioDraftVsPublication') }}</p>
        </div>
        <div v-if="auth?.authenticated" class="action-row">
          <NuxtLink to="/studio/publication">{{ t('studioPublicationManagement') }}</NuxtLink>
          <NuxtLink to="/studio/order">{{ t('studioReorder') }}</NuxtLink>
          <NuxtLink to="/studio/memos">{{ t('studioMemos') }}</NuxtLink>
          <button class="inline-action" type="button" @click="logout">{{ t('studioLogout') }}</button>
        </div>
      </div>
      <p v-if="authPending" role="status">{{ t('studioAuthChecking') }}</p>
      <div v-else-if="!auth?.configured" role="alert">
        <p>{{ t('studioAuthNotConfigured') }}</p>
        <p class="note">{{ t('studioAnonymousReadable') }}</p>
      </div>
      <div v-else-if="!auth.authenticated">
        <p>{{ t('studioLoginRequired') }}</p>
        <a class="login-link" href="/api/auth/discord">{{ t('studioDiscordLogin') }}</a>
      </div>
      <template v-else>
        <p v-if="statusText" class="status-success" role="status">{{ statusText }}</p>
        <p v-if="errorText" class="error-text" role="alert">{{ errorText }}</p>
        <div class="studio-grid">
          <aside class="studio-sidebar" :aria-label="t('studioAuthorLibrary')">
            <div class="section-header">
              <h2>{{ t('studioLibrary') }}</h2>
              <button class="inline-action" type="button" :disabled="busy || autosavingChapter" @click="reloadNodes">{{ t('studioReload') }}</button>
            </div>
            <div class="filter-row" role="group" :aria-label="t('studioMaterialType')">
              <button v-for="(f, key) in filters" :key="key" class="inline-action"
                type="button" :aria-pressed="filter === key" @click="filter = key">{{ f.label }}</button>
            </div>
            <ul class="node-list">
              <li v-for="entry in ordered" :key="entry.node.id">
                <button class="node-button" type="button" :disabled="busy || autosavingChapter" :aria-pressed="selectedId === entry.node.id"
                  :style="{ paddingInlineStart: 10 + entry.depth * 13 + 'px' }"
                  @click="selectNode(entry.node.id)">
                  <small class="note">{{ kinds[entry.node.kind] }}</small>
                  {{ entry.node.draft.title }}
                </button>
              </li>
            </ul>
            <p v-if="!nodes.length" class="note">{{ t('studioEmpty') }}</p>
            <button class="primary" type="button" :disabled="busy || autosavingChapter" @click="openCreate(null)">{{ t('studioNewSeries') }}</button>
            <button v-if="selected && children[selected.kind].length" class="inline-action" type="button"
              :disabled="busy || autosavingChapter" @click="openCreate(selected.id)">{{ t('studioAddChild') }}</button>
          </aside>
          <section class="studio-editor" :aria-label="t('studioEditorForm')">
            <form v-if="createOpen" class="create-form" @submit.prevent="createItem">
              <h2>{{ t('studioAddItem') }}</h2>
              <label>{{ t('studioKindLabel') }}
                <select v-model="createKind">
                  <option v-for="kind in creationChoices" :key="kind" :value="kind">{{ kinds[kind] }}</option>
                </select>
              </label>
              <label>{{ t('studioTitleLabel') }}<input v-model="createTitle" maxlength="150" required /></label>
              <label v-if="createKind === 'word'" class="create-visibility-option">
                <input v-model="createWordIsPublic" type="checkbox" />
                {{ t('studioWordInitialVisibility') }}
              </label>
              <p v-if="createKind === 'word'" class="note">{{ t('studioWordInitialVisibilityNote') }}</p>
              <template v-if="createKind === 'word'">
                <label>{{ t('studioWordCreatePartOfSpeech') }}
                  <select v-if="createWordClasses.length" v-model="createWordPartOfSpeech">
                    <option value="">{{ t('wordUnspecified') }}</option>
                    <option v-for="entry in createWordClasses" :key="entry.id" :value="entry.title">{{ entry.title }}</option>
                  </select>
                  <input v-else v-model="createWordPartOfSpeech" maxlength="80" />
                </label>
                <label>{{ t('studioWordCreateDefinition') }}
                  <textarea v-model="createWordDefinition" maxlength="2000" rows="3" />
                </label>
              </template>
              <div class="action-row">
                <button class="primary" type="submit" :disabled="busy">{{ t('studioCreate') }}</button>
                <button class="inline-action" type="button" :disabled="busy" @click="cancelCreate">{{ t('studioCancel') }}</button>
              </div>
            </form>
            <template v-else-if="selected">
              <h2>{{ kinds[selected.kind] }}：{{ selected.draft.title }}</h2>
              <p class="note">{{ t('studioDraftRevision') }} {{ selected.revision }} ／ {{ publicationStatus }}{{ selected.published ? '（' + t('studioPublishedSnapshot') + '）' : '' }}</p>
              <div v-if="selected.kind === 'chapter'" class="chapter-autosave" role="status">
                <p v-if="chapterRecovery">{{ t('studioRecoveryAvailable') }}
                  <button type="button" class="inline-action" @click="restoreChapterRecovery">{{ t('studioRecoverDraft') }}</button>
                </p>
                <p v-if="autosaveStatus === 'pending'">{{ t('studioAutosavePending') }}</p>
                <p v-else-if="autosaveStatus === 'saved'">{{ t('studioAutosaveSaved') }}</p>
                <p v-else-if="autosaveStatus === 'failed'" class="error-text">{{ t('studioAutosaveFailure') }}
                  <button type="button" class="inline-action" @click="retryChapterAutosave">{{ t('studioAutosaveRetry') }}</button>
                </p>
                <p v-else-if="autosaveStatus === 'conflict'" class="error-text" role="alert">{{ t('studioAutosaveConflict') }}</p>
              </div>
              <form @submit.prevent="saveDraft">
                <label>{{ t('studioNameHeading') }}<input v-model="form.title" maxlength="150" required /></label>
                <ul v-if="selected.kind === 'word' && spellingWarnings.length" class="spelling-warnings" :aria-label="t('studioSpellingWarnings')">
                  <li v-for="warning in spellingWarnings" :key="warning.code">{{ warning.message }}</li>
                </ul>
                <div v-if="selected.kind === 'chapter'" class="manuscript-toolbar" role="group" :aria-label="t('studioManuscriptToolbar')">
                  <button type="button" class="inline-action" :disabled="busy || composingBody" @mousedown.prevent @click="insertMarkup('ruby')">{{ t('studioRubyButton') }}</button>
                  <nav class="page-controls" :aria-label="t('studioPageControls')">
                    <button type="button" class="inline-action" :disabled="busy || composingBody || selectedPage === 0" @click="jumpPage(selectedPage - 1)">{{ t('studioPagePrevious') }}</button>
                    <label>{{ t('studioPageSelect') }}
                      <select :value="selectedPage" :disabled="busy || composingBody" @change="jumpPage(Number(($event.target as HTMLSelectElement).value))">
                        <option v-for="(_, index) in chapterPages" :key="index" :value="index">{{ index + 1 }} / {{ chapterPages.length }}</option>
                      </select>
                    </label>
                    <button type="button" class="inline-action" :disabled="busy || composingBody || selectedPage === chapterPages.length - 1" @click="jumpPage(selectedPage + 1)">{{ t('studioPageNext') }}</button>
                    <button type="button" class="inline-action" :disabled="busy || composingBody" @click="addPageAfter">{{ t('studioPageButton') }}</button>
                    <button type="button" class="inline-action" :disabled="busy || composingBody || selectedPage === 0" @click="reorderPage(-1)">{{ t('studioPageMoveUp') }}</button>
                    <button type="button" class="inline-action" :disabled="busy || composingBody || selectedPage === chapterPages.length - 1" @click="reorderPage(1)">{{ t('studioPageMoveDown') }}</button>
                  </nav>
                </div>
                <label v-if="selected.kind === 'chapter'">{{ t('studioBodyLabel') }}
                  <textarea ref="bodyTextarea" v-model="selectedPageBody" rows="14" maxlength="100000"
                    @compositionstart="composingBody = true" @compositionend="composingBody = false; scheduleChapterAutosave()"
                    :placeholder="t('studioMarkupPlaceholder')"></textarea>
                </label>
                <label v-else>{{ t('studioBodyLabel') }}
                  <textarea v-model="form.body" rows="14" maxlength="100000"></textarea>
                </label>
                <CategoryPresetEditor v-if="selected.kind === 'category'" v-model="categoryPresets" />
                <TipLinksEditor v-if="selected.kind === 'tip'"
                  v-model:tags="tipTags" v-model:related-tip-ids="tipRelatedTipIds"
                  :selected-id="selected.id" :nodes="nodes" />
                <AuthorReferencePanel v-if="selected.kind === 'chapter' || selected.kind === 'tip'"
                  :selected-id="selected.id" :nodes="nodes" />
                <LanguageStructureEditor v-if="selected.kind === 'language'"
                  v-model:characters="languageCharacters" v-model:word-classes="languageWordClasses" />
                <label v-if="selected.kind === 'word' && !form.details.meanings && form.details.partOfSpeech">
                  {{ t('studioLegacyWordClass') }}
                  <input v-model="form.details.partOfSpeech" maxlength="80" />
                </label>
                <WordMeaningsEditor v-if="selected.kind === 'word'" v-model="wordMeanings"
                  :languages="activeWordLanguages" :words="activeWordReferences" :word-classes="activeWordClasses" />
                <label v-if="selected.kind === 'event'">{{ t('studioRelativeYear') }}
                  <input v-model="form.details.year" maxlength="10000" />
                </label>
                <div class="action-row"><button class="primary" type="submit" :disabled="busy || autosavingChapter">{{ t('studioSaveDraft') }}</button></div>
              </form>
              <div v-if="selected.kind === 'tip' && movableCategories.length > 1" class="move-category-controls">
                <label>{{ t('studioCategoryTarget') }}
                  <select v-model="moveCategoryTarget" :disabled="busy">
                    <option v-for="category in movableCategories" :key="category.id" :value="category.id">{{ category.draft.title }}</option>
                  </select>
                </label>
                <button class="inline-action" type="button"
                  :disabled="busy || editorDirty || moveCategoryTarget === selected.parentId"
                  @click="moveTipCategory">{{ t('studioMoveCategory') }}</button>
                <p v-if="editorDirty" class="note">{{ t('studioMoveSaveFirst') }}</p>
              </div>
              <hr />
              <h3>{{ t('studioPublicationSettings') }}</h3>
              <p class="note">{{ t('studioPublicationNote') }}</p>
              <div class="action-row">
                <button class="primary" type="button" :disabled="busy || autosavingChapter" @click="publish">{{ t('studioApplyPublishedDraft') }}</button>
                <button class="inline-action" type="button" :disabled="busy || autosavingChapter || !selected.published"
                  @click="changeVisibility(!selected.isPublic, selected.publicSince)">
                  {{ selected.isPublic ? t('studioHide') : t('studioShow') }}
                </button>
              </div>
              <label>{{ t('studioPublicStartDate') }}
                <input v-model="scheduledLocal" type="datetime-local" />
              </label>
              <button class="inline-action" type="button" :disabled="busy || autosavingChapter || !selected.published" @click="schedule">{{ t('studioSetDate') }}</button>
              <hr />
              <h3>{{ t('studioDraftPreview') }}</h3>
              <RichContent :source="form.body" :pages="selected.kind === 'chapter' ? chapterPages : undefined" />
            </template>
            <div v-else>
              <h2>{{ t('studioChooseItem') }}</h2>
              <p class="note">{{ t('studioChooseItemHint') }}</p>
            </div>
          </section>
        </div>
      </template>
    </ReaderPanel>
  </div>
</template>

<style scoped>
.studio-title, .section-header { display:flex;justify-content:space-between;align-items:center;gap:1rem; }
.studio-title { margin-bottom:1rem; }
.studio-title h1 { margin:.25rem 0; }
.studio-grid { display:grid;grid-template-columns:minmax(210px,300px) minmax(0,1fr);gap:1rem;margin-top:1.5rem; }
.studio-sidebar, .studio-editor { padding:1rem;background:var(--color-background-soft);border:1px solid var(--color-border-base);border-radius:var(--radius-panel);min-width:0; }
.section-header h2 { margin:0; font-size:1.1rem; }
.filter-row { display:flex;flex-wrap:wrap;gap:.3rem;margin:1rem 0; }
.filter-row button { font-size:12px; }
.filter-row button[aria-pressed="true"],.node-button[aria-pressed="true"] { background:#005f7f; color:#fff; }
.node-list { list-style:none;padding:0;max-height:70vh;overflow:auto; }
.node-button { width:100%;text-align:left;padding:7px 10px;background:transparent;border:0;color:var(--color-text-base);overflow-wrap:anywhere; }
.node-button:hover { background:#35464c; }
.studio-sidebar > button { margin:.3rem .3rem .3rem 0; }
.studio-editor h2 { overflow-wrap:anywhere; }
label { display:block;margin:1rem 0;font-weight:650; }
input,select,textarea { display:block;width:100%;margin-top:.45rem;padding:.6rem .7rem;background:var(--color-background-input);color:var(--color-text-base);border:1px solid var(--color-border-base);border-radius:var(--radius-input); }
textarea { min-height:6rem;resize:vertical;line-height:1.7; }
.create-visibility-option { display:flex;align-items:center;gap:.6rem; }
.create-visibility-option input { display:inline-block;width:auto;margin:0; }
.action-row { display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0; }
.manuscript-toolbar { display:flex;flex-wrap:wrap;gap:.4rem;margin:1rem 0 .4rem;align-items:center; }
.page-controls { display:flex;flex-wrap:wrap;gap:.35rem;align-items:end; }
.page-controls select { margin-top:.2rem;min-width:5rem; }
.primary,.login-link { display:inline-block;background:#00698c;border:1px solid var(--color-concept-main);color:#fff;padding:.45rem .8rem;text-decoration:none; }
.status-success { color:#bfffd4; }
hr { border:0;border-top:1px solid var(--color-border-base);margin:1.5rem 0; }
@media (max-width:900px) { .studio-grid { grid-template-columns:minmax(0,1fr); } .studio-title{align-items:flex-start;flex-direction:column;} }
.spelling-warnings { color:#ffe2a9;margin:.25rem 0 1rem; }
</style>
