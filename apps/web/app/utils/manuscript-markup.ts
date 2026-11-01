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
  // Textarea offsets are UTF-16 code units. Never split a surrogate pair.
  const splitsPair = (index: number) => index > 0 && index < source.length &&
    source.charCodeAt(index - 1) >= 0xD800 && source.charCodeAt(index - 1) <= 0xDBFF &&
    source.charCodeAt(index) >= 0xDC00 && source.charCodeAt(index) <= 0xDFFF;
  const splitsCrlf = (index: number) => index > 0 && index < source.length &&
    source[index - 1] === '\r' && source[index] === '\n';
  const marker = '[[page]]';
  const splitsMarker = (index: number) => {
    const at = source.lastIndexOf(marker, index);
    return at >= 0 && index > at && index < at + marker.length;
  };
  if (splitsPair(start) || splitsPair(end) || splitsCrlf(start) || splitsCrlf(end) ||
      splitsMarker(start) || splitsMarker(end)) return null;
  const selected = source.slice(start, end);
  if (kind === 'page') {
    return {
      value: source.slice(0, start) + marker + source.slice(start),
      selectionStart: start + marker.length,
      selectionEnd: start + marker.length,
    };
  }
  // Ruby markup is a single inline text token. Do not silently rewrite multiline selections.
  if (selected.includes(marker) || /[\r\n\u0085\u2028\u2029｜《》]/u.test(selected)) return null;
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
