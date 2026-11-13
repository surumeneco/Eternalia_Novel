/**
 * Local alpha domain model. This code is exploratory / NOT a CAT-generated
 * normative implementation or proof. Pure functions are shared by the alpha
 * preview and the future Nuxt/Nest/PostgreSQL implementation.
 */
import { canReadPublished } from './publication.js';
import { joinChapterPages, pagesForChapter, validateChapterPages } from './manuscript-pages.js';
import { parseWordMeanings, type WordMeaning } from './word-meanings.js';
import { parseTipTags, parseTipRelationIds } from './tip-links.js';
import { parseLanguageCharacters, parseLanguageWordClasses } from './language-structure.js';

export const kinds = [
  'series', 'volume', 'part', 'chapter', 'category', 'tip', 'tipSection',
  'language', 'word', 'grammar', 'periodization', 'event',
] as const;
export type Kind = (typeof kinds)[number];
export type Details = Record<string, string>;
export interface Content { title: string; body: string; details: Details; pages?: string[]; }
export interface Snapshot { value: Content; sourceRevision: number; publishedAt: number; parentId?: string | null; }
export interface NovelNode {
  id: string;
  kind: Kind;
  parentId: string | null;
  order: number;
  draft: Content;
  revision: number;
  published: Snapshot | null;
  isPublic: boolean;
  publicSince: number | null;
  updatedAt: number;
  deletedAt?: number | null;
}
export interface Library { nodes: NovelNode[]; }
export interface ReaderNode { id: string; kind: Kind; parentId: string | null; order: number; content: Content; publishedAt: number; }
export interface DomainError { code: 'bad-request' | 'not-found' | 'conflict' | 'duplicate-spelling'; message: string; existingWordId?: string; }
const parentKinds: Record<Kind, Kind | null> = {
  series: null, volume: 'series', part: 'volume', chapter: 'part',
  category: 'series', tip: 'category', tipSection: 'tip',
  language: 'series', word: 'language', grammar: 'language',
  periodization: 'series', event: 'periodization',
};
export function domainError(code: DomainError['code'], message: string, existingWordId?: string): never {
  throw { code, message, ...(existingWordId ? { existingWordId } : {}) } as DomainError;
}
export function isKind(value: unknown): value is Kind {
  return typeof value === 'string' && (kinds as readonly string[]).includes(value);
}
function bounded(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum) domainError('bad-request', '文字数または型が不正です。');
  return value;
}
function normalizeContent(raw: unknown, kind: Kind): Content {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) domainError('bad-request', '入力データが不正です。');
  const value = raw as Record<string, unknown>;
  const title = bounded(value.title, 150).trim();
  if (!title) domainError('bad-request', 'タイトルを入力してください。');
  const body = bounded(value.body ?? '', 100_000);
  const details: Details = {};
  if (value.details !== undefined) {
    if (!value.details || typeof value.details !== 'object' || Array.isArray(value.details)) domainError('bad-request', '詳細データが不正です。');
    const entries = Object.entries(value.details);
    if (entries.length > 24) domainError('bad-request', '詳細項目が多すぎます。');
    for (const [key, val] of entries) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) domainError('bad-request', '詳細項目キーが不正です。');
      details[key] = bounded(val, 10000);
    }
  }
  if (kind === 'chapter') {
    const pages = value.pages === undefined ? validateChapterPages(body.split('[[page]]'))
      : validateChapterPages(value.pages);
    return { title, body: joinChapterPages(pages), details, pages };
  }
  if (value.pages !== undefined) domainError('bad-request', 'ページ配列は章にのみ指定できます。');
  return { title, body, details };
}
/** Referential integrity for a source language and word within one Series. */
function validateMeaningReferences(library: Library, languageId: string, content: Content): void {
  if (content.details.meanings === undefined) return;
  const meanings = parseWordMeanings(content.details.meanings);
  const sourceSeries = ancestorsOf(library, languageId)[0]?.id;
  for (const meaning of meanings) for (const origin of meaning.etymologies) {
    if (!origin.languageId) continue;
    const language = find(library, origin.languageId);
    if (language.kind !== 'language' || ancestorsOf(library, language.id)[0]?.id !== sourceSeries) {
      domainError('bad-request', '語源の参照言語は同一シリーズに所属する必要があります。');
    }
    if (origin.wordId) {
      const word = find(library, origin.wordId);
      if (word.kind !== 'word' || word.parentId !== language.id) {
        domainError('bad-request', '語源の参照単語は指定した言語に所属する必要があります。');
      }
    }
  }
}
/** Related settings must resolve to another Tip inside the same Series. */
function validateTipReferences(library: Library, sourceId: string, categoryId: string, content: Content): void {
  if (content.details.tags !== undefined) parseTipTags(content.details.tags);
  if (content.details.relatedTipIds === undefined) return;
  const seriesId = ancestorsOf(library, categoryId)[0]?.id;
  for (const targetId of parseTipRelationIds(content.details.relatedTipIds)) {
    if (targetId === sourceId) domainError('bad-request', '自身を関連設定に指定できません。');
    const target = find(library, targetId);
    if (target.kind !== 'tip' || !target.parentId ||
      ancestorsOf(library, target.parentId)[0]?.id !== seriesId) {
      domainError('bad-request', '関連設定は同一シリーズの設定に限定されます。');
    }
  }
}
function validateLanguageStructure(content: Content): void {
  if (content.details.characters !== undefined) parseLanguageCharacters(content.details.characters);
  if (content.details.wordClasses !== undefined) parseLanguageWordClasses(content.details.wordClasses);
}
function find(library: Library, id: string): NovelNode {
  const item = library.nodes.find(n => n.id === id);
  if (!item || item.deletedAt != null) domainError('not-found', '項目が見つかりません。');
  return item;
}
/** A language owns a spelling; different languages may independently use the same spelling. */
function rejectSameLanguageSpelling(library: Library, languageId: string, title: string, editingWordId?: string): void {
  const existing = library.nodes.find(node => node.kind === 'word' && node.parentId === languageId &&
    node.id !== editingWordId && node.deletedAt == null && node.draft.title.trim() === title.trim());
  if (existing) domainError('duplicate-spelling',
    '同じ言語内に同じスペルの単語が登録されています。新規登録はできません。', existing.id);
}
function clone<T>(value: T): T { return structuredClone(value); }
function assertLibrary(library: Library): void {
  if (!library || !Array.isArray(library.nodes)) domainError('bad-request', 'データベース形式が不正です。');
}
export function newLibrary(): Library { return { nodes: [] }; }
export function createNode(library: Library, input: { id: string; kind: Kind; parentId?: string | null; content: Content; isPublic?: boolean; now: number }): Library {
  assertLibrary(library);
  if (!isKind(input.kind)) domainError('bad-request', '種類が不正です。');
  if (input.isPublic !== undefined && (input.kind !== 'word' || typeof input.isPublic !== 'boolean')) {
    domainError('bad-request', '単語の初期公開設定が不正です。');
  }
  if (!/^[0-9a-f-]{36}$/.test(input.id) || library.nodes.some(n => n.id === input.id)) domainError('bad-request', 'IDが不正です。');
  const parentKind = parentKinds[input.kind];
  const parent = input.parentId ? find(library, input.parentId) : null;
  if (parentKind === null ? parent !== null : parent?.kind !== parentKind) domainError('bad-request', '親子階層が不正です。');
  const content = normalizeContent(input.content, input.kind);
  if (input.kind === 'word' && parent) rejectSameLanguageSpelling(library, parent.id, content.title);
  if (input.kind === 'word' && parent) validateMeaningReferences(library, parent.id, content);
  if (input.kind === 'tip' && parent) validateTipReferences(library, input.id, parent.id, content);
  if (input.kind === 'language') validateLanguageStructure(content);
  if (input.kind === 'category' && content.details.presets !== undefined) parsePresets(content.details.presets);
  // Preset sections use a deterministic ID derived from the Tip's first 30
  // characters. Two distinct Tip IDs can share that prefix: reject the second
  // creation before mutating the library rather than creating ambiguous IDs.
  const copiedPresets = input.kind === 'tip' && parent
    ? parsePresets(parent.draft.details.presets ?? '[]') : [];
  const generatedIds = copiedPresets.map((_, i) =>
    `${input.id.slice(0, 30)}${i.toString().padStart(6, '0')}`);
  if (generatedIds.length > 0) {
    const existingIds = new Set(library.nodes.map(node => node.id));
    if (generatedIds.some(id => id === input.id || existingIds.has(id))) {
      domainError('bad-request', '設定項目のIDが既存データと重複しています。');
    }
  }
  const next = clone(library);
  const siblings = next.nodes.filter(n => n.deletedAt == null && n.parentId === (parent?.id ?? null) && n.kind === input.kind);
  next.nodes.push({ id: input.id, kind: input.kind, parentId: parent?.id ?? null,
    order: siblings.length, draft: content, revision: 1, published: null,
    deletedAt: null,
    isPublic: input.kind === 'word' ? (input.isPublic ?? true) : false,
    publicSince: null, updatedAt: input.now });
  // New Tip copies category presets once, with no future propagation.
  if (input.kind === 'tip' && parent) {
    for (const [i, preset] of copiedPresets.entries()) {
      next.nodes.push({ id: generatedIds[i]!, kind: 'tipSection',
        parentId: input.id, order: i, draft: { title: preset.title, body: preset.body, details: {} },
        revision: 1, published: null, isPublic: false, publicSince: null, updatedAt: input.now });
    }
  }
  return next;
}
export function parsePresets(raw: string): { title: string; body: string }[] {
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { domainError('bad-request', 'プリセットJSONが不正です。'); }
  if (!Array.isArray(obj) || obj.length > 30) domainError('bad-request', 'プリセット形式が不正です。');
  return obj.map((p: unknown) => {
    if (!p || typeof p !== 'object') domainError('bad-request', 'プリセット要素が不正です。');
    const v = p as Record<string,unknown>;
    return { title: bounded(v.title, 150), body: bounded(v.body ?? '', 10000) };
  });
}
export function editNode(library: Library, id: string, expectedRevision: number, content: Content, now: number): Library {
  const next = clone(library);
  const item = find(next, id);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== item.revision) domainError('conflict', '他の編集により更新されています。');
  item.draft = normalizeContent(content, item.kind);
  if (item.kind === 'word' && item.parentId) rejectSameLanguageSpelling(next, item.parentId, item.draft.title, id);
  if (item.kind === 'language') validateLanguageStructure(item.draft);
  if (item.kind === 'word' && item.parentId) {
    validateMeaningReferences(next, item.parentId, item.draft);
  }
  if (item.kind === 'category' && item.draft.details.presets !== undefined) parsePresets(item.draft.details.presets);
  if (item.kind === 'tip' && item.parentId) {
    validateTipReferences(next, id, item.parentId, item.draft);
  }
  item.revision += 1;
  item.updatedAt = now;
  return next;
}
/** Move only a Tip's draft membership. Existing public projections keep the
 * snapshot parent until the author explicitly republishes the Tip. */
/** AC-76: mark a previously published, now private leaf as deleted.
 * Keep its draft and snapshot in the DB for audit; reader/admin projections and
 * future mutations must no longer resolve this ID. Never cascade. */
export function softDeleteNode(library: Library, id: string, expectedRevision: number, now: number): Library {
  assertLibrary(library);
  if (!Number.isSafeInteger(now) || now < 0) domainError('bad-request', '削除日時が不正です。');
  const item = find(library, id);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== item.revision) {
    domainError('conflict', '別の編集によって改訂されています。');
  }
  if (!item.published || item.isPublic) {
    domainError('bad-request', '公開済みで現在非公開の対象のみ削除できます。');
  }
  // Both draft and published ancestry must be free of dependents.
  for (const other of library.nodes) {
    if (other.id === id) continue;
    if (other.parentId === id || other.published?.parentId === id) {
      domainError('bad-request', '子要素が残っている対象は削除できません。');
    }
    for (const content of [other.draft, other.published?.value]) {
      if (!content) continue;
      if (other.kind === 'tip' && content.details.relatedTipIds !== undefined &&
          parseTipRelationIds(content.details.relatedTipIds).includes(id)) {
        domainError('bad-request', '関連設定として参照されている対象は削除できません。');
      }
      if (other.kind === 'word' && content.details.meanings !== undefined) {
        for (const meaning of parseWordMeanings(content.details.meanings)) {
          if (meaning.etymologies.some(origin => origin.languageId === id || origin.wordId === id)) {
            domainError('bad-request', '語源として参照されている対象は削除できません。');
          }
        }
      }
    }
  }
  const next = clone(library);
  const target = find(next, id);
  target.deletedAt = now;
  target.revision += 1;
  target.updatedAt = now;
  return next;
}
export function moveTip(library: Library, id: string, expectedRevision: number, categoryId: string, now: number): Library {
  assertLibrary(library);
  if (typeof categoryId !== 'string' || !Number.isSafeInteger(now) || now < 0) {
    domainError('bad-request', '移動先または更新日時が不正です。');
  }
  const tip = find(library, id);
  if (tip.kind !== 'tip' || !tip.parentId || categoryId === tip.parentId) {
    domainError('bad-request', '設定の移動元・移動先が不正です。');
  }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== tip.revision) {
    domainError('conflict', '別の編集によって改訂されています。');
  }
  const category = find(library, categoryId);
  if (category.kind !== 'category' ||
      ancestorsOf(library, tip.parentId)[0]?.id !== ancestorsOf(library, category.id)[0]?.id) {
    domainError('bad-request', '移動先は同じシリーズのカテゴリに限定されます。');
  }
  const next = clone(library);
  const draft = find(next, id);
  // Backfill legacy snapshot ancestry before changing the draft parent.
  if (draft.published && draft.published.parentId === undefined) draft.published.parentId = draft.parentId;
  // Keep the old published list order until explicit publication. A draft Tip
  // may temporarily share an order value with destination siblings.
  draft.parentId = categoryId;
  draft.revision += 1;
  draft.updatedAt = now;
  // No new presets and no changes to child TipSections, tags or published value.
  return next;
}
export function publishNode(library: Library, id: string, expectedRevision: number, now: number): Library {
  const next = clone(library);
  const item = find(next, id);
  if (expectedRevision !== item.revision) domainError('conflict', '変更が競合しています。');
  // An explicitly published category switch appends the Tip in the destination;
  // the earlier draft move must not change the old public list ordering.
  if (item.kind === 'tip' && item.published && item.published.parentId !== undefined &&
      item.published.parentId !== item.parentId) {
    const peers = next.nodes.filter(n => n.kind === 'tip' && n.parentId === item.parentId && n.id !== id);
    item.order = peers.reduce((max,n) => Math.max(max,n.order), -1) + 1;
  }
  item.published = { value: clone(item.draft), sourceRevision: item.revision, publishedAt: now, parentId: item.parentId };
  // Publishing a word snapshot must not override an explicitly private word.
  // Other kinds retain their established publish-to-visible behavior.
  if (item.kind !== 'word') item.isPublic = true;
  if (item.publicSince === null) item.publicSince = now;
  item.updatedAt = now;
  return next;
}
export function setVisibility(library: Library, id: string, expectedRevision: number, isPublic: boolean, publicSince: number | null, now: number): Library {
  const next = clone(library);
  const item = find(next, id);
  if (expectedRevision !== item.revision) domainError('conflict', '変更が競合しています。');
  if (typeof isPublic !== 'boolean') domainError('bad-request', '公開設定が不正です。');
  if (publicSince !== null && (!Number.isSafeInteger(publicSince) || publicSince < 0)) domainError('bad-request', '公開日時が不正です。');
  if (isPublic && item.published === null) domainError('bad-request', '公開版がありません。先に公開版を作成してください。');
  item.isPublic = isPublic;
  item.publicSince = isPublic ? (publicSince ?? now) : publicSince;
  item.revision += 1;
  item.updatedAt = now;
  return next;
}
function ancestry(library: Library, id: string, usePublishedParent: boolean): NovelNode[] {
  const chain: NovelNode[] = [];
  const visited = new Set<string>();
  let current: NovelNode | null = find(library, id);
  while (current) {
    if (visited.has(current.id) || chain.length > 32) domainError('bad-request', '階層に循環があります。');
    visited.add(current.id);
    chain.unshift(current);
    const parent: string | null = usePublishedParent && current.published?.parentId !== undefined
      ? current.published.parentId : current.parentId;
    current = parent ? find(library, parent) : null;
  }
  return chain;
}
export function ancestorsOf(library: Library, id: string): NovelNode[] { return ancestry(library, id, false); }
export function publicAncestorsOf(library: Library, id: string): NovelNode[] { return ancestry(library, id, true); }
/** Resolve an etymology reference without recursively projecting other word etymologies. */
function readableReference(library: Library, id: string, kind: Kind, now: number): NovelNode | null {
  let chain: NovelNode[];
  try { chain = publicAncestorsOf(library, id); } catch { return null; }
  const node = chain[chain.length - 1];
  if (!node || node.kind !== kind || !node.published) return null;
  return canReadPublished(
    chain.map(part => ({ isPublic: part.isPublic, publicSinceEpochMs: part.publicSince })),
    chain.every(part => part.published !== null), now,
  ) ? node : null;
}
function publicMeaning(library: Library, meaning: WordMeaning, now: number): WordMeaning {
  return {
    id: meaning.id, partOfSpeech: meaning.partOfSpeech, definition: meaning.definition,
    etymologies: meaning.etymologies.map(origin => {
      const language = origin.languageId
        ? readableReference(library, origin.languageId, 'language', now) : null;
      const word = origin.wordId && language
        ? readableReference(library, origin.wordId, 'word', now) : null;
      return {
        id: origin.id, note: origin.note,
        ...(language ? {
          languageId: language.id,
          languageTitle: language.published!.value.title,
        } : {}),
        ...(word ? {
          wordId: word.id,
          wordTitle: word.published!.value.title,
        } : {}),
      };
    }),
  };
}
export function toReader(library: Library, id: string, now: number): ReaderNode | null {
  let path: NovelNode[];
  try { path = publicAncestorsOf(library, id); } catch { return null; }
  if (!canReadPublished(path.map(n => ({ isPublic: n.isPublic, publicSinceEpochMs: n.publicSince })),
      path.every(n => n.published !== null), now)) return null;
  const node = path[path.length - 1];
  if (!node?.published) return null;
  const published = node.published.value;
  // Only fields explicitly designed for readers may cross the API boundary.
  // In particular, category presets are AUTHOR metadata, even if category is public.
  const details: Details = {};
  if (node.kind === 'tip') {
    if (published.details.tags !== undefined) {
      details.tags = JSON.stringify(parseTipTags(published.details.tags));
    }
    if (published.details.relatedTipIds !== undefined) {
      const related = parseTipRelationIds(published.details.relatedTipIds).flatMap(targetId => {
        const target = readableReference(library, targetId, 'tip', now);
        return target ? [{ id: target.id, title: target.published!.value.title }] : [];
      });
      details.relatedTips = JSON.stringify(related);
    }
  }
  if (node.kind === 'word') {
    if (published.details.partOfSpeech !== undefined) details.partOfSpeech = published.details.partOfSpeech;
    if (published.details.meanings !== undefined) {
      details.meanings = JSON.stringify(parseWordMeanings(published.details.meanings)
        .map(meaning => publicMeaning(library, meaning, now)));
    }
  }
  if (node.kind === 'language') {
    if (published.details.characters !== undefined) {
      details.characters = JSON.stringify(parseLanguageCharacters(published.details.characters));
    }
    if (published.details.wordClasses !== undefined) {
      details.wordClasses = JSON.stringify(parseLanguageWordClasses(published.details.wordClasses));
    }
  }
  if (node.kind === 'event' && published.details.year !== undefined) details.year = published.details.year;
  return { id: node.id, kind: node.kind, parentId: node.published.parentId !== undefined ? node.published.parentId : node.parentId,
    order: node.order, content: { title: published.title, body: published.body, details,
      ...(node.kind === 'chapter' ? { pages: pagesForChapter(published) } : {}) },
    publishedAt: node.published.publishedAt };
}
export function publicTree(library: Library, seriesId: string, now: number): ReaderNode[] {
  const series = toReader(library, seriesId, now);
  if (!series || series.kind !== 'series') return [];
  // Walk only descendants of the selected series; unrelated worlds never
  // need public projection or ancestry lookup during this request.
  const children = new Map<string, NovelNode[]>();
  for (const node of library.nodes) {
    const parentId = node.published?.parentId !== undefined ? node.published.parentId : node.parentId;
    if (!parentId) continue;
    const siblings = children.get(parentId) ?? [];
    siblings.push(node);
    children.set(parentId, siblings);
  }
  const result: ReaderNode[] = [series];
  const visited = new Set<string>([seriesId]);
  const queue = [seriesId];
  for (let index = 0; index < queue.length; index++) {
    for (const child of children.get(queue[index]!) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      const readable = toReader(library, child.id, now);
      if (!readable) continue;
      result.push(readable);
      queue.push(child.id);
    }
  }
  return result.sort((a,b) => a.order - b.order || a.content.title.localeCompare(b.content.title));
}
export function publicSeries(library: Library, now: number): ReaderNode[] {
  return library.nodes.filter(n => n.kind === 'series').map(n => toReader(library, n.id, now))
    .filter((n): n is ReaderNode => n !== null)
    .sort((a, b) => a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja'));
}
/**
 * Recent public content is projected through the same ancestor/snapshot gate as
 * individual item URLs. Never derive it from draft.updatedAt or raw node titles.
 */
export function publicRecent(library: Library, now: number, limit = 10): ReaderNode[] {
  const recentKinds: ReadonlySet<Kind> = new Set(['chapter', 'tip', 'tipSection', 'word', 'grammar', 'event']);
  const safeLimit = Number.isSafeInteger(limit) ? Math.max(0, Math.min(limit, 50)) : 10;
  if (safeLimit === 0) return [];
  // Published timestamps determine recent order, so evaluate the newest
  // candidates first rather than projecting every old or unpublished item.
  const candidates = library.nodes.filter(node => recentKinds.has(node.kind) && node.published !== null)
    .sort((a,b) => b.published!.publishedAt - a.published!.publishedAt || a.id.localeCompare(b.id));
  const recent: ReaderNode[] = [];
  for (const candidate of candidates) {
    const node = toReader(library, candidate.id, now);
    if (node) recent.push(node);
    if (recent.length === safeLimit) break;
  }
  return recent;
}
export function managedList(library: Library): NovelNode[] { return clone(library.nodes.filter(n => n.deletedAt == null)); }
