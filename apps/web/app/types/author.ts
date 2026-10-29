import type { ReaderKind } from './reader';

export interface AuthorNode {
  id: string;
  kind: ReaderKind;
  parentId: string | null;
  order: number;
  draft: { title: string; body: string; details: Record<string,string> };
  revision: number;
  published: { value: { title: string; body: string; details: Record<string,string> }; sourceRevision: number; publishedAt: number } | null;
  isPublic: boolean;
  publicSince: number | null;
  updatedAt: number;
}
