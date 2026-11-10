/** Public API projection: no drafts, author metadata or authentication secrets. */
export type ReaderKind = 'series' | 'volume' | 'part' | 'chapter' | 'category' |
  'tip' | 'tipSection' | 'language' | 'word' | 'grammar' | 'periodization' | 'event';

export interface ReaderNode {
  id: string;
  kind: ReaderKind;
  parentId: string | null;
  order: number;
  content: {
    title: string;
    body: string;
    details: Record<string, string>;
  };
  publishedAt: number;
}
