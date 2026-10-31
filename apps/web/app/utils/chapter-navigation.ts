/** Ordered published chapter navigation within one Series.
 * Input must be the existing public tree, never the author's library.
 */
import type { ReaderKind, ReaderNode } from '../types/reader';

export function publishedChapterSequence(tree: readonly ReaderNode[], seriesId: string): ReaderNode[] {
  if (!tree.some(node => node.id === seriesId && node.kind === 'series')) return [];
  const children = (parentId: string, kind: ReaderKind): ReaderNode[] =>
    tree.filter(node => node.parentId === parentId && node.kind === kind)
      .sort((a, b) => a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja'));
  return children(seriesId, 'volume')
    .flatMap(volume => children(volume.id, 'part')
      .flatMap(part => children(part.id, 'chapter')));
}
