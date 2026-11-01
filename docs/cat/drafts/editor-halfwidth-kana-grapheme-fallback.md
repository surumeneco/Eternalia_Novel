# Editor grapheme fallback: halfwidth kana dakuten (CAT Draft)

Status: **Draft**, not Confirmed. Leaf: `TASK-20261101-009`.

## Process / PI

Textarea selection positions are UTF-16 code-unit offsets. When `Intl.Segmenter` is unavailable, the fallback must not insert page/ruby markup between a halfwidth katakana base and its voiced or semi-voiced sound mark (`U+FF9E`, `U+FF9F`). These marks are Unicode modifier letters, not `\p{M}`, so the existing combining-mark fallback alone misses the cluster boundary.

Treat a boundary immediately before either mark as internal to a grapheme. Preserve normal insertion at the end of the complete cluster. Do not change the UTF-16 selection-offset contract.

## TCE / acceptance vectors

- EDIT-GRAPHEME-14: `ｶﾞ` between base and `ﾞ` rejects page and ruby insertion without Segmenter.
- EDIT-GRAPHEME-15: `ﾊﾟ` between base and `ﾟ` rejects page and ruby insertion without Segmenter.
- EDIT-GRAPHEME-16: insertion immediately after each complete cluster succeeds.
- EDIT-GRAPHEME-17: behavior with `Intl.Segmenter` present remains unchanged.

Real Android/Gboard IME composition and Undo remain separate manual acceptance conditions. Formal CAT machine Gates are not-run.
