/**
 * Canonical chapter body is a sequenced array. The legacy marker-joined text
 * is kept as a derived compatibility projection for older alpha clients.
 */
export const PAGE_MARKER = '[[page]]';
export const MAX_CHAPTER_LENGTH = 100_000;
export const MAX_CHAPTER_PAGES = 1000;

/** Non-mutating read of canonical pages, with old content fallback. */
export function pagesForChapter(content: { body: string; pages?: readonly string[] }): string[] {
  return content.pages ? [...content.pages] : content.body.split(PAGE_MARKER);
}

/** Validate the exact page array before it enters the draft or published snapshot. */
export function validateChapterPages(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_CHAPTER_PAGES ||
      raw.some(page => typeof page !== 'string')) {
    throw { code: 'bad-request', message: 'ページ配列が不正です。' };
  }
  const pages = raw as string[];
  // Match the historical 100k-character chapter envelope including separators.
  const length = pages.reduce((sum, page) => sum + page.length, 0) +
    PAGE_MARKER.length * (pages.length - 1);
  if (length > MAX_CHAPTER_LENGTH) {
    throw { code: 'bad-request', message: 'ページ本文の文字数上限を超えています。' };
  }
  return [...pages];
}

export function joinChapterPages(pages: readonly string[]): string {
  return pages.join(PAGE_MARKER);
}
