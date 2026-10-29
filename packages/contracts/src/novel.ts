/**
 * Local alpha domain model. This code is exploratory / NOT a CAT-generated
 * normative implementation or proof. Pure functions are shared by the alpha
 * preview and the future Nuxt/Nest/PostgreSQL implementation.
 */
import { canReadPublished } from './publication.js';

export const kinds = [
  'series', 'volume', 'part', 'chapter', 'category', 'tip', 'tipSection',
  'language', 'word', 'grammar', 'periodization', 'event',
] as const;
export type Kind = (typeof kinds)[number];
export type Details = Record<string, string>;
export interface Content { title: string; body: string; details: Details; }
export interface Snapshot { value: Content; sourceRevision: number; publishedAt: number; }
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
}
export interface Library { nodes: NovelNode[]; }
export interface ReaderNode { id: string; kind: Kind; parentId: string | null; order: number; content: Content; publishedAt: number; }
export interface DomainError { code: 'bad-request' | 'not-found' | 'conflict'; message: string; }
const parentKinds: Record<Kind, Kind | null> = {
  series: null, volume: 'series', part: 'volume', chapter: 'part',
  category: 'series', tip: 'category', tipSection: 'tip',
  language: 'series', word: 'language', grammar: 'language',
  periodization: 'series', event: 'periodization',
};
export function domainError(code: DomainError['code'], message: string): never {
  throw { code, message } as DomainError;
}
export function isKind(value: unknown): value is Kind {
  return typeof value === 'string' && (kinds as readonly string[]).includes(value);
}
function bounded(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum) domainError('bad-request', '文字数または型が不正です。');
  return value;
}
function normalizeContent(raw: unknown): Content {
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
  return { title, body, details };
}
function find(library: Library, id: string): NovelNode {
  const item = library.nodes.find(n => n.id === id);
  if (!item) domainError('not-found', '項目が見つかりません。');
  return item;
}
function clone<T>(value: T): T { return structuredClone(value); }
function assertLibrary(library: Library): void {
  if (!library || !Array.isArray(library.nodes)) domainError('bad-request', 'データベース形式が不正です。');
}
export function newLibrary(): Library { return { nodes: [] }; }
export function createNode(library: Library, input: { id: string; kind: Kind; parentId?: string | null; content: Content; now: number }): Library {
  assertLibrary(library);
  if (!isKind(input.kind)) domainError('bad-request', '種類が不正です。');
  if (!/^[0-9a-f-]{36}$/.test(input.id) || library.nodes.some(n => n.id === input.id)) domainError('bad-request', 'IDが不正です。');
  const parentKind = parentKinds[input.kind];
  const parent = input.parentId ? find(library, input.parentId) : null;
  if (parentKind === null ? parent !== null : parent?.kind !== parentKind) domainError('bad-request', '親子階層が不正です。');
  const content = normalizeContent(input.content);
  const next = clone(library);
  const siblings = next.nodes.filter(n => n.parentId === (parent?.id ?? null) && n.kind === input.kind);
  next.nodes.push({ id: input.id, kind: input.kind, parentId: parent?.id ?? null,
    order: siblings.length, draft: content, revision: 1, published: null,
    isPublic: input.kind === 'word', publicSince: null, updatedAt: input.now });
  // New Tip copies category presets once, with no future propagation.
  if (input.kind === 'tip' && parent) {
    const presets = parsePresets(parent.draft.details.presets ?? '[]');
    for (const [i, preset] of presets.entries()) {
      next.nodes.push({ id: `${input.id.slice(0, 30)}${i.toString().padStart(6,'0')}`, kind: 'tipSection',
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
  item.draft = normalizeContent(content);
  if (item.kind === 'category' && item.draft.details.presets !== undefined) parsePresets(item.draft.details.presets);
  item.revision += 1;
  item.updatedAt = now;
  return next;
}
export function publishNode(library: Library, id: string, expectedRevision: number, now: number): Library {
  const next = clone(library);
  const item = find(next, id);
  if (expectedRevision !== item.revision) domainError('conflict', '変更が競合しています。');
  item.published = { value: clone(item.draft), sourceRevision: item.revision, publishedAt: now };
  item.isPublic = true;
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
export function ancestorsOf(library: Library, id: string): NovelNode[] {
  const chain: NovelNode[] = [];
  const visited = new Set<string>();
  let current: NovelNode | null = find(library, id);
  while (current) {
    if (visited.has(current.id) || chain.length > 32) domainError('bad-request', '階層に循環があります。');
    visited.add(current.id);
    chain.unshift(current);
    current = current.parentId ? find(library, current.parentId) : null;
  }
  return chain;
}
export function toReader(library: Library, id: string, now: number): ReaderNode | null {
  let path: NovelNode[];
  try { path = ancestorsOf(library, id); } catch { return null; }
  if (!canReadPublished(path.map(n => ({ isPublic: n.isPublic, publicSinceEpochMs: n.publicSince })),
      path.every(n => n.published !== null), now)) return null;
  const node = path[path.length - 1];
  if (!node?.published) return null;
  const published = node.published.value;
  // Only fields explicitly designed for readers may cross the API boundary.
  // In particular, category presets are AUTHOR metadata, even if category is public.
  const details: Details = {};
  if (node.kind === 'word' && published.details.partOfSpeech !== undefined) details.partOfSpeech = published.details.partOfSpeech;
  if (node.kind === 'event' && published.details.year !== undefined) details.year = published.details.year;
  return { id: node.id, kind: node.kind, parentId: node.parentId,
    order: node.order, content: { title: published.title, body: published.body, details },
    publishedAt: node.published.publishedAt };
}
export function publicTree(library: Library, seriesId: string, now: number): ReaderNode[] {
  const series = toReader(library, seriesId, now);
  if (!series || series.kind !== 'series') return [];
  const visible = library.nodes.map(n => toReader(library, n.id, now)).filter((n): n is ReaderNode => n !== null);
  const included = new Set<string>([seriesId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of visible) if (item.parentId && included.has(item.parentId) && !included.has(item.id)) { included.add(item.id); changed = true; }
  }
  return visible.filter(n => included.has(n.id)).sort((a,b) => a.order - b.order || a.content.title.localeCompare(b.content.title));
}
export function publicSeries(library: Library, now: number): ReaderNode[] {
  return library.nodes.filter(n => n.kind === 'series').map(n => toReader(library, n.id, now)).filter((n): n is ReaderNode => n !== null);
}
/**
 * Recent public content is projected through the same ancestor/snapshot gate as
 * individual item URLs. Never derive it from draft.updatedAt or raw node titles.
 */
export function publicRecent(library: Library, now: number, limit = 10): ReaderNode[] {
  const recentKinds: ReadonlySet<Kind> = new Set(['chapter', 'tip', 'tipSection', 'word', 'grammar', 'event']);
  const safeLimit = Number.isSafeInteger(limit) ? Math.max(0, Math.min(limit, 50)) : 10;
  return library.nodes
    .filter(node => recentKinds.has(node.kind))
    .map(node => toReader(library, node.id, now))
    .filter((node): node is ReaderNode => node !== null)
    .sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id))
    .slice(0, safeLimit);
}
export function managedList(library: Library): NovelNode[] { return clone(library.nodes); }
