export declare const kinds: readonly ["series", "volume", "part", "chapter", "category", "tip", "tipSection", "language", "word", "grammar", "periodization", "event"];
export type Kind = (typeof kinds)[number];
export type Details = Record<string, string>;
export interface Content {
    title: string;
    body: string;
    details: Details;
}
export interface Snapshot {
    value: Content;
    sourceRevision: number;
    publishedAt: number;
}
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
export interface Library {
    nodes: NovelNode[];
}
export interface ReaderNode {
    id: string;
    kind: Kind;
    parentId: string | null;
    order: number;
    content: Content;
    publishedAt: number;
}
export interface DomainError {
    code: 'bad-request' | 'not-found' | 'conflict';
    message: string;
}
export declare function domainError(code: DomainError['code'], message: string): never;
export declare function isKind(value: unknown): value is Kind;
export declare function newLibrary(): Library;
export declare function createNode(library: Library, input: {
    id: string;
    kind: Kind;
    parentId?: string | null;
    content: Content;
    now: number;
}): Library;
export declare function parsePresets(raw: string): {
    title: string;
    body: string;
}[];
export declare function editNode(library: Library, id: string, expectedRevision: number, content: Content, now: number): Library;
export declare function publishNode(library: Library, id: string, expectedRevision: number, now: number): Library;
export declare function setVisibility(library: Library, id: string, expectedRevision: number, isPublic: boolean, publicSince: number | null, now: number): Library;
export declare function ancestorsOf(library: Library, id: string): NovelNode[];
export declare function toReader(library: Library, id: string, now: number): ReaderNode | null;
export declare function publicTree(library: Library, seriesId: string, now: number): ReaderNode[];
export declare function publicSeries(library: Library, now: number): ReaderNode[];
export declare function managedList(library: Library): NovelNode[];
