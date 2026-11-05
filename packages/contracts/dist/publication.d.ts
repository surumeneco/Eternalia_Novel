/**
 * EXPERIMENTAL code draft. Not a CAT-compiled production artifact.
 * These pure functions model the approved semantics of a detached draft and
 * published snapshot, without assuming an ORM or HTTP contract.
 */
export type JsonValue = null | string | number | boolean | JsonValue[] | {
    [key: string]: JsonValue;
};
export interface PublicationGate {
    /** Independent flag; hiding a parent hides every descendant. */
    readonly isPublic: boolean;
    /** UTC epoch milliseconds. null is never considered publicly accessible. */
    readonly publicSinceEpochMs: number | null;
}
export interface VersionedDraft<T extends JsonValue> {
    readonly draftRevision: number;
    readonly draftValue: T;
    readonly publishedSnapshot: {
        readonly sourceDraftRevision: number;
        readonly value: T;
    } | null;
}
export type RevisionResult<T extends JsonValue> = {
    readonly ok: true;
    readonly next: VersionedDraft<T>;
} | {
    readonly ok: false;
    readonly reason: 'revision-conflict';
};
/**
 * Returns false if the complete ancestor-to-self path is unpublished,
 * future-dated, incomplete or no published snapshot exists.
 * Deliberately independent of draft content.
 */
export declare function canReadPublished(path: readonly PublicationGate[], hasPublishedSnapshot: boolean, nowEpochMs: number): boolean;
/** Draft save must never implicitly update the reader-facing snapshot. */
export declare function saveDraft<T extends JsonValue>(record: VersionedDraft<T>, expectedRevision: number, draftValue: T): RevisionResult<T>;
/** Explicit publish copies exactly the current draft to an independent snapshot. */
export declare function publishDraft<T extends JsonValue>(record: VersionedDraft<T>, expectedRevision: number): RevisionResult<T>;
/** Never returns the draft; absence is explicit (not an empty-string stand-in). */
export declare function getReaderSnapshot<T extends JsonValue>(record: VersionedDraft<T>, ancestorToSelf: readonly PublicationGate[], nowEpochMs: number): {
    readonly found: false;
} | {
    readonly found: true;
    readonly content: T;
};
