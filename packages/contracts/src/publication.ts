/**
 * EXPERIMENTAL code draft. Not a CAT-compiled production artifact.
 * These pure functions model the approved semantics of a detached draft and
 * published snapshot, without assuming an ORM or HTTP contract.
 */
export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

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

export type RevisionResult<T extends JsonValue> =
  | { readonly ok: true; readonly next: VersionedDraft<T> }
  | { readonly ok: false; readonly reason: 'revision-conflict' };

/**
 * Returns false if the complete ancestor-to-self path is unpublished,
 * future-dated, incomplete or no published snapshot exists.
 * Deliberately independent of draft content.
 */
export function canReadPublished(
  path: readonly PublicationGate[],
  hasPublishedSnapshot: boolean,
  nowEpochMs: number,
): boolean {
  if (!hasPublishedSnapshot || path.length === 0 || !Number.isFinite(nowEpochMs)) {
    return false;
  }
  return path.every((node) =>
    node.isPublic &&
    node.publicSinceEpochMs !== null &&
    Number.isFinite(node.publicSinceEpochMs) &&
    node.publicSinceEpochMs <= nowEpochMs,
  );
}

/** Draft save must never implicitly update the reader-facing snapshot. */
export function saveDraft<T extends JsonValue>(
  record: VersionedDraft<T>,
  expectedRevision: number,
  draftValue: T,
): RevisionResult<T> {
  if (record.draftRevision !== expectedRevision) {
    return { ok: false, reason: 'revision-conflict' };
  }
  return {
    ok: true,
    next: {
      draftRevision: record.draftRevision + 1,
      draftValue: structuredClone(draftValue),
      publishedSnapshot: record.publishedSnapshot === null ? null : structuredClone(record.publishedSnapshot),
    },
  };
}

/** Explicit publish copies exactly the current draft to an independent snapshot. */
export function publishDraft<T extends JsonValue>(
  record: VersionedDraft<T>,
  expectedRevision: number,
): RevisionResult<T> {
  if (record.draftRevision !== expectedRevision) {
    return { ok: false, reason: 'revision-conflict' };
  }
  return {
    ok: true,
    next: {
      draftRevision: record.draftRevision,
      draftValue: structuredClone(record.draftValue),
      publishedSnapshot: {
        sourceDraftRevision: record.draftRevision,
        value: structuredClone(record.draftValue),
      },
    },
  };
}

/** Never returns the draft; absence is explicit (not an empty-string stand-in). */
export function getReaderSnapshot<T extends JsonValue>(
  record: VersionedDraft<T>,
  ancestorToSelf: readonly PublicationGate[],
  nowEpochMs: number,
): { readonly found: false } | { readonly found: true; readonly content: T } {
  if (!canReadPublished(ancestorToSelf, record.publishedSnapshot !== null, nowEpochMs) || record.publishedSnapshot === null) {
    return { found: false };
  }
  return { found: true, content: structuredClone(record.publishedSnapshot.value) };
}
