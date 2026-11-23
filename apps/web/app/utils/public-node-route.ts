import type { ReaderNode, ReaderKind } from '../types/reader';

/** Resolve one canonical reader URL strictly from the published ancestor chain.
 * A mismatched parent or cross-series node must not be linked as if it belonged
 * to the selected series. The API remains responsible for public projection.
 */
export function publicNodeRoute(tree: readonly ReaderNode[], nodeId: string): string | null {
  const index = new Map(tree.map(node => [node.id, node]));
  const path: ReaderNode[] = [];
  const seen = new Set<string>();
  let node = index.get(nodeId);
  while (node && !seen.has(node.id) && path.length < 8) {
    path.unshift(node);
    seen.add(node.id);
    node = node.parentId ? index.get(node.parentId) : undefined;
  }
  if (!path.length || path[0]?.kind !== 'series' || path[0]?.parentId !== null || node) return null;
  const kinds = path.map(item => item.kind).join('/');
  const ids = path.map(item => encodeURIComponent(item.id));
  const root = `/series/${ids[0]}`;
  const routes: Record<string,string> = {
    series: root,
    'series/volume': `${root}/stories/${ids[1]}`,
    'series/volume/part': `${root}/stories/${ids[1]}/parts/${ids[2]}`,
    'series/volume/part/chapter': `${root}/stories/${ids[1]}/parts/${ids[2]}/chapters/${ids[3]}`,
    'series/category': `${root}/settings/${ids[1]}`,
    'series/category/tip': `${root}/settings/${ids[1]}/${ids[2]}`,
    'series/category/tip/tipSection': `${root}/settings/${ids[1]}/${ids[2]}/sections/${ids[3]}`,
    'series/language': `${root}/dictionaries/${ids[1]}`,
    'series/language/word': `${root}/dictionaries/${ids[1]}/words/${ids[2]}`,
    'series/language/grammar': `${root}/dictionaries/${ids[1]}/grammar/${ids[2]}`,
    'series/periodization': `${root}/timeline/periods/${ids[1]}`,
    'series/periodization/event': `${root}/timeline/periods/${ids[1]}/events/${ids[2]}`,
  };
  return routes[kinds] ?? null;
}

export function publicAreaRoute(seriesId: string, area: 'stories' | 'settings' | 'dictionaries' | 'timeline'): string {
  return `/series/${encodeURIComponent(seriesId)}/${area}`;
}

export function belongsToPublicSeries(tree: readonly ReaderNode[], id: string, seriesId: string, kind?: ReaderKind): boolean {
  const node = tree.find(item => item.id === id);
  if (!node || (kind && node.kind !== kind)) return false;
  return publicNodeRoute(tree, id)?.startsWith(`/series/${encodeURIComponent(seriesId)}/`) ?? false;
}
