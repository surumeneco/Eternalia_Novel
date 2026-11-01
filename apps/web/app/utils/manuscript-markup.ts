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
  // Runtime callers may bypass TypeScript's erased union discriminator.
  if (kind !== 'page' && kind !== 'ruby') return null;
  if (!Number.isInteger(start) || !Number.isInteger(end) ||
      start < 0 || end < start || end > source.length) return null;
  // Textarea offsets are UTF-16 code units. Never split a surrogate pair.
  const splitsPair = (index: number) => index > 0 && index < source.length &&
    source.charCodeAt(index - 1) >= 0xD800 && source.charCodeAt(index - 1) <= 0xDBFF &&
    source.charCodeAt(index) >= 0xDC00 && source.charCodeAt(index) <= 0xDFFF;
  const splitsCrlf = (index: number) => index > 0 && index < source.length &&
    source[index - 1] === '\r' && source[index] === '\n';
  // Textarea offsets can also split combining kana, emoji ZWJ or flag clusters.
  const graphemes = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(source)
    : null;
  // Older WebViews may lack Intl.Segmenter. Preserve common Japanese/emoji
  // clusters conservatively without changing textarea's UTF-16 offsets.
  const codePointBefore = (index: number): number => {
    const last = source.charCodeAt(index - 1);
    if (last >= 0xDC00 && last <= 0xDFFF && index > 1) {
      const first = source.charCodeAt(index - 2);
      if (first >= 0xD800 && first <= 0xDBFF)
        return 0x10000 + ((first - 0xD800) << 10) + last - 0xDC00;
    }
    return last;
  };
  const isRegionalIndicator = (cp: number) => cp >= 0x1F1E6 && cp <= 0x1F1FF;
  const fallbackSplitsGrapheme = (index: number): boolean => {
    if (index <= 0 || index >= source.length) return false;
    const previous = codePointBefore(index);
    const next = source.codePointAt(index)!;
    if (previous === 0x200D || next === 0x200D ||
        /\p{M}/u.test(String.fromCodePoint(next)) ||
        // Halfwidth kana voicing marks are modifier letters, not \p{M},
        // but Unicode grapheme segmentation joins them to the base kana.
        next === 0xFF9E || next === 0xFF9F ||
        (next >= 0x1F3FB && next <= 0x1F3FF) ||
        // Emoji subdivision flags use supplementary tag code points that
        // are neither combining marks nor ZWJ. Keep the tag run attached.
        (next >= 0xE0020 && next <= 0xE007F)) return true;
    if (!isRegionalIndicator(previous) || !isRegionalIndicator(next)) return false;
    // Pair consecutive regional indicators from the start of their run.
    // The boundary after an odd count is inside a flag, after an even count is valid.
    let count = 0;
    let cursor = index;
    while (cursor > 0) {
      const cp = codePointBefore(cursor);
      if (!isRegionalIndicator(cp)) break;
      count++;
      cursor -= cp > 0xFFFF ? 2 : 1;
    }
    return count % 2 === 1;
  };
  const splitsGrapheme = (index: number) => graphemes !== null
    ? index > 0 && index < source.length && graphemes.containing(index)?.index !== index
    : fallbackSplitsGrapheme(index);
  const marker = '[[page]]';
  const splitsMarker = (index: number) => {
    const at = source.lastIndexOf(marker, index);
    return at >= 0 && index > at && index < at + marker.length;
  };
  if (splitsPair(start) || splitsPair(end) || splitsGrapheme(start) || splitsGrapheme(end) ||
      splitsCrlf(start) || splitsCrlf(end) ||
      splitsMarker(start) || splitsMarker(end)) return null;
  // Match the reader's inline ruby grammar before editing an existing token.
  const rubyTokens = /｜([^｜《》\r\n\u0085\u2028\u2029]+)《([^｜《》\r\n\u0085\u2028\u2029]+)》/g;
  for (const match of source.matchAll(rubyTokens)) {
    const inside = (index: number) => index > match.index && index < match.index + match[0].length;
    if (inside(start) || inside(end)) return null;
  }
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
