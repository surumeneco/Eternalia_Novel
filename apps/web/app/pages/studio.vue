<script setup lang="ts">
import { parseJstLocalDateTime,formatJstLocalDateTime } from '~/utils/jst-publication-time';
import { wordClassInputPolicy } from '~/utils/word-class-input-policy';
import type { AuthorNode } from '~/types/author';
import { localizeApiError } from '~/utils/api-error-localization';
import { localizeSpellingWarning } from '~/utils/spelling-warning-localization';
const { t, language } = useUiLocale();
const { confirm: showConfirmation } = useAppDialog();
const studioRoute = useRoute();
import type { ReaderKind } from '~/types/reader';
import { parseLanguageWordClasses, diagnoseWordSpelling, appendDuplicateWordMeaning, pagesForChapter, joinChapterPages } from '@eternalia/contracts';
import { insertManuscriptMarkup, type ManuscriptInsertionKind } from '~/utils/manuscript-markup';
import { chapterRecoveryKey, chapterRecoveryMatches, chapterRecoveryPrefix, isAutosaveRevisionConflict, parseChapterRecovery, type ChapterRecovery } from '~/utils/chapter-autosave';

interface AuthState { configured: boolean; authenticated: boolean }
const { data: auth, pending: authPending, refresh: refreshAuth } =
  await useFetch<AuthState>('/api/auth/me');

const kinds = computed<Record<ReaderKind, string>>(() => ({
  series: t('studioKindSeries'), volume: t('studioKindVolume'), part: t('studioKindPart'), chapter: t('chapter'),
  category: t('studioKindCategory'), tip: t('tip'), tipSection: t('tipSection'),
  language: t('studioKindLanguage'), word: t('word'), grammar: t('grammar'),
  periodization: t('studioKindPeriodization'), event: t('event'),
}));
const children: Record<ReaderKind | 'root', ReaderKind[]> = {
  root: ['series'],
  series: ['volume', 'category', 'language', 'periodization'],
  volume: ['part'], part: ['chapter'], chapter: [],
  category: ['tip'], tip: ['tipSection'], tipSection: [],
  language: ['word', 'grammar'], word: [], grammar: [],
  periodization: ['event'], event: [],
};
const filters = computed(() => ({
  stories: { label: t('studioFilterStories'), kinds: ['volume','part','chapter'] as ReaderKind[] },
  tips: { label: t('studioFilterTips'), kinds: ['category','tip','tipSection'] as ReaderKind[] },
  dictionaries: { label: t('studioFilterDictionaries'), kinds: ['language','word','grammar'] as ReaderKind[] },
  timeline: { label: t('studioFilterTimeline'), kinds: ['periodization','event'] as ReaderKind[] },
}));
type Filter = keyof typeof filters.value;
const firstKindByArea: Record<Filter, ReaderKind> = {
  stories: 'volume', tips: 'category', dictionaries: 'language', timeline: 'periodization',
};

const nodes = ref<AuthorNode[]>([]);
const selectedId = ref<string | null>(null);
const selectedSeriesId = ref<string | null>(null);
const selected = computed(() => nodes.value.find(n => n.id === selectedId.value) ?? null);
const seriesList = computed(() => nodes.value.filter(n => n.kind === 'series' && n.parentId === null)
  .sort((a, b) => a.order - b.order || a.draft.title.localeCompare(b.draft.title, 'ja')));
const selectedSeries = computed(() => seriesList.value.find(n => n.id === selectedSeriesId.value) ?? null);
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
// Publication settings belong to the individual editor, not exclusively to
// the batch publication page. They must not change the unsaved draft buffer.
const publicStartInput=ref('');
watch(() => [selected.value?.id,selected.value?.publicSince], () => {
  publicStartInput.value=selected.value?.publicSince===null||!selected.value
    ? '' : formatJstLocalDateTime(selected.value.publicSince)??'';
}, {immediate:true});
const inheritedPublicationStatus=computed(()=>{
  const subject=selected.value;
  if(!subject)return '';
  let parentId=subject.published?.parentId??subject.parentId;
  const seen=new Set<string>([subject.id]);
  while(parentId&&!seen.has(parentId)){
    seen.add(parentId);
    const parent=nodes.value.find(n=>n.id===parentId);
    if(!parent||!parent.published||!parent.isPublic||parent.publicSince===null||parent.publicSince>Date.now())
      return t('pubAncestorPrivate');
    parentId=parent.published?.parentId??parent.parentId;
  }
  return '';
});

const filter = ref<Filter>('stories');
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
async function confirmDiscard(): Promise<boolean> {
  return !hasUnsavedChanges.value || await showConfirmation(t('studioUnsavedDiscard'));
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
async function selectNode(nodeId: string) {
  if (busy.value || autosavingChapter.value) return;
  if (selectedId.value === nodeId && !createOpen.value) return;
  if (!await confirmDiscard()) return;
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  cancelAutosaveTimer();
  createOpen.value = false;
  selectedId.value = nodeId;
  selectedSeriesId.value = owningSeriesId(nodeId);
  filter.value = areaForKind(byId.value.get(nodeId)?.kind ?? 'series');
  restoreEditor();
}
async function cancelCreate() {
  if (busy.value) return;
  if (creationDirty.value && !await showConfirmation(t('studioNewItemDiscard'))) return;
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
onBeforeRouteLeave(async () => {
  if (!await confirmDiscard()) return false;
  cancelAutosaveTimer();
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
});
// /studio/child is a nested route: its parent stays mounted, so the leave
// guard alone does not protect unsaved editor input on child navigation.
onBeforeRouteUpdate(async (to, from) => {
  if (from.path !== '/studio' || to.fullPath === from.fullPath) return;
  if (!await confirmDiscard()) return false;
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
function owningSeriesId(nodeId: string | null): string | null {
  const visited = new Set<string>();
  let node = nodeId ? byId.value.get(nodeId) : undefined;
  while (node && !visited.has(node.id)) {
    visited.add(node.id);
    if (node.kind === 'series') return node.id;
    node = node.parentId ? byId.value.get(node.parentId) : undefined;
  }
  return null;
}
function areaForKind(kind: ReaderKind): Filter {
  if (kind === 'category' || kind === 'tip' || kind === 'tipSection') return 'tips';
  if (kind === 'language' || kind === 'word' || kind === 'grammar') return 'dictionaries';
  if (kind === 'periodization' || kind === 'event') return 'timeline';
  return 'stories';
}
async function chooseArea(next: Filter) {
  if (filter.value === next || busy.value || autosavingChapter.value) return;
  if (!await confirmDiscard()) return;
  cancelAutosaveTimer();
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  createOpen.value = false;
  selectedId.value = null;
  filter.value = next;
  restoreEditor();
}
async function chooseSeries(event: Event) {
  const target = event.target as HTMLSelectElement;
  if (busy.value || autosavingChapter.value || !await confirmDiscard()) {
    target.value = selectedSeriesId.value ?? '';
    return;
  }
  cancelAutosaveTimer();
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  selectedSeriesId.value = target.value || null;
  selectedId.value = null;
  filter.value = 'stories';
  createOpen.value = false;
  restoreEditor();
}
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
  return diagnoseWordSpelling({ nodes: nodes.value }, selected.value.id, form.title)
    .map(warning => ({ ...warning, message: localizeSpellingWarning(warning.code, t) }));
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
      if (filters.value[filter.value].kinds.includes(node.kind)) out.push({node,depth});
      visit(node.id, depth+1);
    }
  }
  // A series must be chosen before its materials can enter this editor tree.
  if (selectedSeriesId.value) visit(selectedSeriesId.value, 0);
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


async function load(): Promise<boolean> {
  try {
    nodes.value = await $fetch<AuthorNode[]>('/api/admin/nodes');
    if (!nodes.value.some(n => n.id === selectedId.value)) selectedId.value = null;
    if (!seriesList.value.some(n => n.id === selectedSeriesId.value)) selectedSeriesId.value = null;
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
    const requestedCreate = studioRoute.query.create;
    if (requestedCreate !== undefined) {
      const queryParent = studioRoute.query.parent;
      const parentId = queryParent === undefined ? null :
        typeof queryParent === 'string' ? queryParent : undefined;
      const parent = parentId ? byId.value.get(parentId) : null;
      const parentKind = parentId === null ? 'root' : parent?.kind;
      if (typeof requestedCreate === 'string' && parentId !== undefined && parentKind &&
          children[parentKind].includes(requestedCreate as ReaderKind)) {
        selectedSeriesId.value = owningSeriesId(parentId);
        filter.value = areaForKind(requestedCreate as ReaderKind);
        await openCreate(parentId, requestedCreate as ReaderKind);
      } else {
        errorText.value = t('studioInvalidCreateLink');
      }
    } else {
      const requested = typeof studioRoute.query.item === 'string' ? studioRoute.query.item :
        (['volumeId','partId','chapterId','categoryId','tipId','languageId','wordId','periodId','eventId','seriesId','grammarId','sectionId','id']
          .map(key=>studioRoute.params[key]).find(value=>typeof value==='string') as string|undefined);
      if (typeof requested === 'string' && nodes.value.some(node => node.id === requested)) {
        selectedId.value = requested;
        selectedSeriesId.value = owningSeriesId(requested);
        filter.value = areaForKind(byId.value.get(requested)!.kind);
      }
    }
  }
});
async function reloadNodes() {
  if (!await confirmDiscard()) return;
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
    errorText.value = localizeApiError(e, language.value, t, t('studioSaveError'));
  } finally {
    busy.value = false;
    if (selected.value?.kind === 'chapter' && editorDirty.value) scheduleChapterAutosave();
  }
}
async function openCreate(parentId: string | null, preferredKind?: ReaderKind) {
  if (busy.value || autosavingChapter.value || !await confirmDiscard()) return;
  if (selected.value?.kind === 'chapter') clearChapterRecovery(selected.value.id);
  cancelAutosaveTimer();
  restoreEditor();
  createParentId.value = parentId;
  if (parentId) selectedSeriesId.value = owningSeriesId(parentId);
  else selectedSeriesId.value = null;
  const parent = parentId ? byId.value.get(parentId) : null;
  const allowedKinds = children[parent?.kind || 'root'];
  createKind.value = preferredKind && allowedKinds.includes(preferredKind)
    ? preferredKind : allowedKinds[0] || 'series';
  createTitle.value = '';
  createWordIsPublic.value = true;
  createWordPartOfSpeech.value = '';
  createWordDefinition.value = '';
  createOpen.value = true;
}
async function createItem() {
  if (!createTitle.value.trim()) { errorText.value=t('studioCreateTitleRequired'); return; }
  const attempt = {
    partOfSpeechId: createWordPartOfSpeech.value.trim(),
    definition: createWordDefinition.value.trim(),
  };
  const duplicateOutcome: { wordId: string | null } = { wordId: null };
  let createdId = '';
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
              createKind.value === 'word' ? { meanings: attempt.partOfSpeechId || attempt.definition
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
    // The new child is not in byId until the server readback. Resolve its
    // series from its already-validated parent to keep the creation context.
    selectedSeriesId.value = createKind.value === 'series'
      ? response.id : owningSeriesId(createParentId.value);
    filter.value = areaForKind(createKind.value);
    createdId = response.id;
  }, t('studioCreated'));
  if (createdId && studioRoute.query.create) {
    await nextTick();
    await navigateTo({path:'/studio',query:{item:createdId}}, {replace:true});
  }
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
    if (!await showConfirmation(t('studioAutosaveConflictConfirm'))) return;
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
async function updateOwnPublication(kind:'snapshot'|'visibility'|'date') {
  const node=selected.value;
  if(!node||busy.value||autosavingChapter.value)return;
  if(kind==='snapshot'&&!await showConfirmation(t('studioPublishConfirm')))return;
  if(kind==='visibility'&&!node.published){errorText.value=t('pubPublishFirst');return;}
  const nextDate=publicStartInput.value?parseJstLocalDateTime(publicStartInput.value):null;
  if(kind==='date'&&publicStartInput.value&&nextDate===null){errorText.value=t('studioInvalidDate');return;}
  if(kind==='date'&&!node.published){errorText.value=t('pubPublishFirst');return;}
  await runChange(async()=>{
    const endpoint=kind==='snapshot'?'publish':'visibility';
    await $fetch('/api/admin/nodes/'+encodeURIComponent(node.id)+'/'+endpoint,{
      method:'POST',body:kind==='snapshot'?{expectedRevision:node.revision}:{
        expectedRevision:node.revision,
        isPublic:kind==='visibility'?!node.isPublic:node.isPublic,
        publicSince:kind==='date'?nextDate:node.publicSince,
      },
    });
  },kind==='snapshot'?t('studioPublished'):t('studioVisibilityChanged'));
}
async function softDeleteSelected() {
  const node = selected.value;
  if (!node || !node.published || node.isPublic || !await confirmDiscard() ||
      !await showConfirmation(t('studioSoftDeleteConfirm'))) return;
  await runChange(async () => {
    await $fetch('/api/admin/nodes/' + node.id + '/soft-delete', {
      method: 'POST', body: { expectedRevision: node.revision },
    });
    if (node.kind === 'chapter') clearChapterRecovery(node.id);
  }, t('studioSoftDeleted'));
}
async function logout() {
  if (!await confirmDiscard()) return;
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
  <NuxtPage v-if="studioRoute.path.startsWith('/studio/')" />
  <div v-else>
    <TopicPath :items="[{label:t('home'),to:'/'},{label:t('studio')}]" />
    <ReaderPanel>
      <div class="studio-title">
        <div>
                     <h1>{{ t('studio') }}</h1>
          <p>{{ t('studioDraftVsPublication') }}</p>
        </div>
        <div v-if="auth?.authenticated" class="action-row">
          <NuxtLink :to="{ path: '/studio/publication', query: selectedSeriesId ? { series: selectedSeriesId } : {} }">{{ t('studioPublicationManagement') }}</NuxtLink>
          <NuxtLink :to="{ path: '/studio/order', query: selectedSeriesId ? { series: selectedSeriesId } : {} }">{{ t('studioReorder') }}</NuxtLink>
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
              <h2>{{ t('studioKindSeries') }}</h2>
              <button class="inline-action" type="button" :disabled="busy || autosavingChapter" @click="reloadNodes">{{ t('studioReload') }}</button>
            </div>
            <label>{{ t('searchSelectSeries') }}
              <select :value="selectedSeriesId ?? ''" :disabled="busy || autosavingChapter" @change="chooseSeries">
                <option value="">{{ t('searchSelectSeries') }}</option>
                <option v-for="series in seriesList" :key="series.id" :value="series.id">{{ series.draft.title }}</option>
              </select>
            </label>
            <button type="button" class="inline-action" :disabled="busy || autosavingChapter"
              @click="openCreate(null)">{{ t('studioNewSeries') }}</button>
            <template v-if="selectedSeries">
              <button type="button" class="inline-action" :disabled="busy || autosavingChapter"
                @click="selectNode(selectedSeries.id)">{{ t('studioKindSeries') }}：{{ selectedSeries.draft.title }}</button>
              <h3>{{ t('studioMaterialType') }}</h3>
            <div class="filter-row" role="group" :aria-label="t('studioMaterialType')">
              <button v-for="(f, key) in filters" :key="key" class="inline-action"
                type="button" :disabled="busy || autosavingChapter" :aria-pressed="filter === key"
                @click="chooseArea(key as Filter)">{{ f.label }}</button>
            </div>
            <button type="button" class="inline-action" :disabled="busy || autosavingChapter"
              @click="openCreate(selectedSeries.id, firstKindByArea[filter])">{{ t('studioAddItem') }}</button>
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
            <p v-if="!ordered.length" class="note">{{ t('studioEmpty') }}</p>
            <button v-if="selected && children[selected.kind].length" class="inline-action" type="button"
              :disabled="busy || autosavingChapter" @click="openCreate(selected.id)">{{ t('studioAddChild') }}</button>
            </template>
            <p v-else class="note">{{ t('searchChooseSeries') }}</p>
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
                  <select v-model="createWordPartOfSpeech" :disabled="!wordClassInputPolicy(createWordClasses.length > 0, false).choiceEnabled">
                    <option value="">{{ t('wordUnspecified') }}</option>
                    <option v-for="entry in createWordClasses" :key="entry.id" :value="entry.id">{{ entry.title }}</option>
                  </select>
                </label>
                <p v-if="!createWordClasses.length" class="note">{{ t('wordClassMasterEmpty') }}</p>
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
                  <textarea ref="bodyTextarea" class="manuscript-body" v-model="selectedPageBody" rows="14" maxlength="100000"
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
                <WordMeaningsEditor v-if="selected.kind === 'word'" v-model="wordMeanings"
                  :languages="activeWordLanguages" :words="activeWordReferences" :word-classes="activeWordClasses" />
                <label v-if="selected.kind === 'periodization'">{{ t('studioPeriodRelativeYears') }}
                  <input v-model="form.details.relativeYears" maxlength="10000" />
                </label>
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
              <section class="publication-editor" :aria-label="t('studioPublicationSettings')">
                <h3>{{ t('studioPublicationSettings') }}</h3>
                <p class="note">{{ t('studioPublicationNote') }}</p>
                <p v-if="inheritedPublicationStatus" class="note">{{ inheritedPublicationStatus }}</p>
                <p class="note">{{ publicationStatus }}</p>
                <div class="action-row">
                  <button type="button" class="inline-action" :disabled="busy||autosavingChapter"
                    @click="updateOwnPublication('snapshot')">{{ t('studioApplyPublishedDraft') }}</button>
                  <button type="button" class="inline-action" :disabled="busy||autosavingChapter||!selected.published"
                    @click="updateOwnPublication('visibility')">{{ selected.isPublic?t('studioHide'):t('studioShow') }}</button>
                </div>
                <label>{{ t('studioPublicStartDate') }} — {{ t('pubJstZoneNote') }}
                  <input v-model="publicStartInput" type="datetime-local" :disabled="busy||!selected.published" />
                </label>
                <button type="button" class="inline-action" :disabled="busy||!selected.published"
                  @click="updateOwnPublication('date')">{{ t('studioSetDate') }}</button>
              </section>
              <div v-if="selected.published && !selected.isPublic" class="action-row">
                <button class="inline-action" type="button" :disabled="busy || autosavingChapter"
                  @click="softDeleteSelected">{{ t('studioSoftDelete') }}</button>
              </div>
              <hr />
              <h3>{{ t('studioDraftPreview') }}</h3>
              <RichContent :source="form.body" :pages="selected.kind === 'chapter' ? chapterPages : undefined" />
            </template>
            <div v-else>
              <h2>{{ selectedSeries ? t('studioChooseItem') : t('searchSelectSeries') }}</h2>
              <p class="note">{{ selectedSeries ? t('studioChooseItem') : t('searchChooseSeries') }}</p>
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
/* Author manuscript only: a readable horizontal writing measure with ample room
 * for Japanese prose. Keep the inherited stone palette and leave the other
 * structured editors' input geometry unchanged. These are trial UX values. */
textarea.manuscript-body {
  width: 100%;
  max-width: 72ch;
  min-height: clamp(24rem, 58vh, 46rem);
  line-height: 1.95;
  font-weight: 400; /* override bold label weight for the editable prose itself */
  padding: clamp(.8rem, 1.4vw, 1.1rem);
  overflow-wrap: anywhere;
}
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
