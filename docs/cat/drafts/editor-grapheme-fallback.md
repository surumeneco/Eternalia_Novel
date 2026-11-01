# Editor grapheme boundary fallback (CAT Draft)

Status: **Draft**, not Confirmed. Leaf: TASK-20261101-009. Parent: TASK-20261031-001.

## Process / PI

Textarea selections are UTF-16 offsets. The current insertion helper uses `Intl.Segmenter` to reject boundaries inside extended grapheme clusters, but older browsers/WebViews without Segmenter only guard surrogate pairs and CRLF. Japanese combining dakuten, emoji ZWJ sequences, emoji modifiers and regional-indicator flag pairs may be split by page/ruby insertion in that fallback.

When `Intl.Segmenter` is unavailable, conservatively reject boundaries adjacent to combining marks, variation selectors, emoji modifiers or ZWJ, and reject boundaries between an odd-numbered run of regional indicators and the next indicator. Preserve valid boundaries between complete flags and ordinary characters. Do not change modern Segmenter behavior, page/ruby grammar or textarea offset semantics.

## TCE / acceptance vectors

- EDIT-GRAPHEME-FALLBACK-01 (Red): without Segmenter, page/ruby insertion cannot split decomposed Japanese `か\u3099`.
- EDIT-GRAPHEME-FALLBACK-02 (Red): without Segmenter, insertion cannot split `👩‍💻` or skin-tone-modified emoji.
- EDIT-GRAPHEME-FALLBACK-03 (Red): without Segmenter, insertion cannot split a two-indicator flag, but may occur between two complete flags.
- EDIT-GRAPHEME-FALLBACK-04 (Red): without Segmenter, subdivision-flag emoji tag characters (U+E0020–U+E007F) must not be split by markup insertion; the boundary after the complete flag remains valid.
- EDIT-GRAPHEME-FALLBACK-05 (Regression): ordinary text, CRLF and supplementary surrogate boundaries retain existing behavior.

## Gate status

Formal CAT machine Gates **not-run**; Draft not Confirmed. Node tests are not a substitute for real Android Japanese IME, Undo/Redo and device/browser acceptance.
