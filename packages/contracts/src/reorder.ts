/**
 * Explicit reorder is a publication-affecting author operation.
 * It changes only siblings of the same kind, with revision checks for all
 * affected nodes. Reader order changes only when the author invokes it.
 */
import { type Kind, type Library, type NovelNode, domainError } from './novel.js';
export interface ReorderRequest {
  parentId: string | null;
  kind: Kind;
  orderedIds: string[];
  expectedRevisions: Record<string, number>;
}
export function reorderSiblings(library: Library, request: ReorderRequest, now: number): Library {
  if (!request || !Array.isArray(request.orderedIds) || !Number.isSafeInteger(now) || now < 0) {
    domainError('bad-request', '並べ替え入力が不正です。');
  }
  if (!request.expectedRevisions || typeof request.expectedRevisions !== 'object' ||
    Array.isArray(request.expectedRevisions)) domainError('bad-request', '改訂番号の指定が必要です。');
  if (typeof request.kind !== 'string' || !['series','volume','part','chapter',
    'category','tip','tipSection','language','word','grammar','periodization','event'].includes(request.kind)) {
    domainError('bad-request', '対象の種類が不正です。');
  }
  const parentKinds: Record<Kind, Kind | null> = {
    series: null, volume: 'series', part: 'volume', chapter: 'part',
    category: 'series', tip: 'category', tipSection: 'tip',
    language: 'series', word: 'language', grammar: 'language',
    periodization: 'series', event: 'periodization',
  };
  if (!(request.parentId === null || typeof request.parentId === 'string')) {
    domainError('bad-request', '親IDが不正です。');
  }
  const parent = request.parentId === null
    ? null : library.nodes.find(node => node.id === request.parentId);
  if (parentKinds[request.kind] === null
    ? request.parentId !== null
    : !parent || parent.kind !== parentKinds[request.kind]) {
    domainError('bad-request', '並べ替え対象の親子階層が不正です。');
  }
  const siblings = library.nodes.filter(n => n.parentId === request.parentId && n.kind === request.kind)
    .sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
  if (siblings.length !== request.orderedIds.length || new Set(request.orderedIds).size !== siblings.length ||
    !siblings.every(n => request.orderedIds.includes(n.id))) {
    domainError('bad-request', '同じ階層の全項目を指定する必要があります。');
  }
  for (const sibling of siblings) {
    if (sibling.revision !== request.expectedRevisions[sibling.id]) {
      domainError('conflict', '並べ替え対象が別の編集によって更新されています。');
    }
  }
  const next = structuredClone(library);
  const byId = new Map<string, NovelNode>(next.nodes.map(node => [node.id,node]));
  for (let index = 0; index < request.orderedIds.length; index++) {
    const node = byId.get(request.orderedIds[index]!);
    if (!node) domainError('not-found', '項目が見つかりません。');
    if (node.order !== index) {
      node.order = index;
      node.revision++;
      node.updatedAt = now;
    }
  }
  return next;
}
