/** Ordered published chapter navigation within one Series.
 * Input must be the existing public tree, never the author's library.
 */
import type { ReaderKind, ReaderNode } from '../types/reader';

export function publishedChapterSequence(tree: readonly ReaderNode[], seriesId: string): ReaderNode[] {
  if (!tree.some(node => node.id === seriesId && node.kind === 'series')) return [];

  // Index the supplied public tree once. Re-filtering it for every volume and
  // part makes chapter traversal quadratic as a series grows.
  const byParent = new Map<string | null, Map<ReaderKind, ReaderNode[]>>();
  for (const node of tree) {
    let byKind = byParent.get(node.parentId);
    if (!byKind) {
      byKind = new Map();
      byParent.set(node.parentId, byKind);
    }
    let siblings = byKind.get(node.kind);
    if (!siblings) {
      siblings = [];
      byKind.set(node.kind, siblings);
    }
    siblings.push(node);
  }

  const children = (parentId: string, kind: ReaderKind): ReaderNode[] =>
    [...(byParent.get(parentId)?.get(kind) ?? [])]
      .sort((a, b) => a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja'));
  return children(seriesId, 'volume')
    .flatMap(volume => children(volume.id, 'part')
      .flatMap(part => children(part.id, 'chapter')));
}
