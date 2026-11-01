# Editor grapheme fallback: Hangul Jamo composition (CAT Draft)

Status: **Draft**, not Confirmed. Leaf: `TASK-20261101-009`.

## Process / PI

When `Intl.Segmenter` is unavailable, the editor's UTF-16 selection fallback must preserve Hangul conjoining Jamo clusters. Unicode grapheme rules GB6–GB8 join leading (L), vowel (V), and trailing (T) Jamo, including a precomposed LV/LVT syllable followed by trailing Jamo. These code points are not necessarily Unicode combining marks, so a mark-only fallback can split a single displayed syllable.

Implement only the explicit Hangul grapheme boundary rules, keeping existing Japanese/emoji handling and textarea offset semantics intact.

## TCE / acceptance vectors

- EDIT-GRAPHEME-18: `각` rejects page/ruby insertion at both internal boundaries without Segmenter.
- EDIT-GRAPHEME-19: `각` rejects insertion between LV syllable and trailing Jamo.
- EDIT-GRAPHEME-20: insertion after the complete cluster succeeds.
- EDIT-GRAPHEME-21: two adjacent complete clusters retain a valid boundary between them.

This does not replace real IME composition, Android keyboard or Undo acceptance. Formal CAT machine Gates remain not-run.
