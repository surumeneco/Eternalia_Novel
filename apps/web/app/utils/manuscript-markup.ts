/** Selection offsets use UTF-16 code units, as provided by textarea.selectionStart. */
export type ManuscriptInsertionKind = 'page' | 'ruby';
export interface ManuscriptInsertion {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}
export function insertManuscriptMarkup(
  source: string, start: number, end: number, kind: ManuscriptInsertionKind,
): ManuscriptInsertion | null {
  if (!Number.isInteger(start) || !Number.isInteger(end) ||
      start < 0 || end < start || end > source.length) return null;
  const selected = source.slice(start, end);
  if (kind === 'page') {
    const marker = '[[page]]';
    return {
      value: source.slice(0, start) + marker + source.slice(end),
      selectionStart: start + marker.length,
      selectionEnd: start + marker.length,
    };
  }
  // Ruby markup is a single inline text token. Do not silently rewrite multiline selections.
  if (selected.includes('\n') || /[｜《》]/.test(selected)) return null;
  const base = selected || '文字';
  const reading = 'よみ';
  const markup = '｜' + base + '《' + reading + '》';
  const selectionStart = selected ? start + 1 + base.length + 1 : start + 1;
  const selectionEnd = selected ? selectionStart + reading.length : selectionStart + base.length;
  return {
    value: source.slice(0, start) + markup + source.slice(end),
    selectionStart, selectionEnd,
  };
}
