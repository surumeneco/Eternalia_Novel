/**
 * Returns false if the complete ancestor-to-self path is unpublished,
 * future-dated, incomplete or no published snapshot exists.
 * Deliberately independent of draft content.
 */
export function canReadPublished(path, hasPublishedSnapshot, nowEpochMs) {
    if (!hasPublishedSnapshot || path.length === 0 || !Number.isFinite(nowEpochMs)) {
        return false;
    }
    return path.every((node) => node.isPublic &&
        node.publicSinceEpochMs !== null &&
        Number.isFinite(node.publicSinceEpochMs) &&
        node.publicSinceEpochMs <= nowEpochMs);
}
/** Draft save must never implicitly update the reader-facing snapshot. */
export function saveDraft(record, expectedRevision, draftValue) {
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
export function publishDraft(record, expectedRevision) {
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
export function getReaderSnapshot(record, ancestorToSelf, nowEpochMs) {
    if (!canReadPublished(ancestorToSelf, record.publishedSnapshot !== null, nowEpochMs) || record.publishedSnapshot === null) {
        return { found: false };
    }
    return { found: true, content: structuredClone(record.publishedSnapshot.value) };
}
