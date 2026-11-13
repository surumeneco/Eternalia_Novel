/** Tab-scoped author recovery for unpublished chapter edits.
 * This is not a publication API or an authentication mechanism.
 */
export interface ChapterRecovery {
  version: 1;
  nodeId: string;
  baseRevision: number;
  savedAt: number;
  title: string;
  pages: string[];
  details: Record<string, string>;
}

export const chapterRecoveryPrefix = 'eternalia:chapter-recovery:';
export function chapterRecoveryKey(nodeId: string): string {
  return chapterRecoveryPrefix + nodeId;
}

export function parseChapterRecovery(raw: string | null, nodeId: string): ChapterRecovery | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const data = value as Record<string, unknown>;
    if (data.version !== 1 || data.nodeId !== nodeId ||
        !Number.isSafeInteger(data.baseRevision) || Number(data.baseRevision) < 0 ||
        !Number.isFinite(data.savedAt) ||
        typeof data.title !== 'string' || data.title.length > 200 ||
        !Array.isArray(data.pages) || data.pages.length < 1 || data.pages.length > 1000 ||
        !data.pages.every(page => typeof page === 'string') ||
        data.pages.reduce<number>((n, page) => n + (page as string).length, 0) > 100000 ||
        !data.details || typeof data.details !== 'object' || Array.isArray(data.details) ||
        !Object.values(data.details).every(item => typeof item === 'string')) return null;
    // Copy only known fields; do not trust arbitrary prototype or nested objects.
    return {
      version: 1, nodeId, baseRevision: data.baseRevision as number,
      savedAt: data.savedAt as number, title: data.title,
      pages: [...data.pages] as string[],
      details: { ...data.details as Record<string, string> },
    };
  } catch { return null; }
}

export function chapterRecoveryMatches(
  recovery: ChapterRecovery, saved: { title: string; pages: string[]; details: Record<string, string> },
): boolean {
  if (recovery.title !== saved.title || JSON.stringify(recovery.pages) !== JSON.stringify(saved.pages)) return false;
  const keys = new Set([...Object.keys(recovery.details), ...Object.keys(saved.details)]);
  return [...keys].every(key => (recovery.details[key] ?? '') === (saved.details[key] ?? ''));
}

export function isAutosaveRevisionConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { statusCode?: number; status?: number; response?: { status?: number } };
  return value.statusCode === 409 || value.status === 409 || value.response?.status === 409;
}
