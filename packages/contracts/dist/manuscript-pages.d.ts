/**
 * Canonical chapter body is a sequenced array. The legacy marker-joined text
 * is kept as a derived compatibility projection for older alpha clients.
 */
export declare const PAGE_MARKER = "[[page]]";
export declare const MAX_CHAPTER_LENGTH = 100000;
export declare const MAX_CHAPTER_PAGES = 1000;
/** Non-mutating read of canonical pages, with old content fallback. */
export declare function pagesForChapter(content: {
    body: string;
    pages?: readonly string[];
}): string[];
/** Validate the exact page array before it enters the draft or published snapshot. */
export declare function validateChapterPages(raw: unknown): string[];
export declare function joinChapterPages(pages: readonly string[]): string;
