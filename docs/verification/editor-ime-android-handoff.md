# α editor / reader manual acceptance handoff

Status: **pending device verification**. Leaf `TASK-20261101-009`. This is a reproducible handoff, **not** a claim that Android, IME, Undo, or the old v0.3 visual design has passed.

## Preconditions

Use the Draft PR #6 branch on an isolated test deployment, with a test author account and a disposable chapter. Record the exact commit SHA, deployed URL, browser version, Android version, keyboard/IME, screen size, test item ID, and whether the API uses test data. Do not publish a real manuscript. Preserve a screenshot or short recording of each observed failure; redact credentials and unpublished text.

## Editing / Japanese IME

1. Enter a long manuscript (at least 20,000 Japanese characters) containing paragraph breaks, `𠮷`, emoji, combining characters, ruby (`｜漢字《かんじ》`) and `[[page]]`. Save, reload and compare exact content and cursor behavior.
2. With Gboard or another Japanese IME, start composition in the chapter textarea. While composition is active, verify that ruby/page toolbar buttons cannot insert markup. Commit the conversion and insert ruby around the committed text. Verify no lost characters or duplicate composition.
3. Select a supplementary character completely, insert ruby and verify the reading placeholder is selected. Attempt to split its UTF-16 surrogate pair through programmatic selection and verify insertion is rejected. Test CRLF and Unicode line separators through imported content. Distinguish a real textarea/IME test from a direct helper test: browsers may normalize selection boundaries, so a successful UI attempt alone does not prove that a deliberately invalid UTF-16 offset was rejected by the helper.
4. Insert ruby with and without selection, insert page markers at selection start, and verify all surrounding text is preserved. Use Undo and Redo repeatedly, then edit again and save. Record browser-specific native Undo behavior; fallback model updates are not automatically equivalent to native Undo.
5. Make unsaved changes and attempt a different item, nested `/studio/*` route, reload, browser back, and tab close. Confirm the warning appears and that cancel preserves the buffer. After save, verify that the warning no longer appears.

## Mobile reader / old-design comparison

6. On Android Chrome in portrait and landscape, test 320–430 CSS-pixel widths, toolbar hit targets, virtual keyboard resize, textarea scroll, horizontal overflow, focus visibility, and navigation. Repeat with accessibility font scaling and reduced motion. Record whether `Intl.Segmenter` is available; a modern-Chrome pass does **not** establish the fallback behavior of older WebViews. For a fallback-capable test environment, separately record the result for Indic conjunct `क्ष` (U+0915 U+094D U+0937): the current conservative fallback does not implement general Indic GB9c joining, whereas `Intl.Segmenter` treats it as one grapheme. Treat this as an explicitly scoped Unicode limitation, not a passed fallback case or a reason to infer all-script support.
7. Compare the same chapter with the approved v0.3 reference for Reader Shell, stone-tablet treatment, colors, chapter navigation, line wrapping, ruby rendering, and page boundaries. Record each deviation against an explicit accepted reference rather than assuming the previous design must be copied wholesale.
8. Test the public reader with a long chapter, ruby, page markers, slow network and refresh; ensure no author-only content appears and that navigation remains usable.

## Segmenter非対応環境の文字素境界マトリクス（Draft・未実行）

`Intl.Segmenter`が実際に不在のWebView、または隔離テストビルドでfallback分岐を明示的に選択した環境で実施する。後者の結果は実機の古いWebView受入と区別する。各ケースで選択端点のUTF-16 offset、挿入可否、挿入後の原文、Undo後の原文を記録する。

| Draft vector | 入力・選択位置 | 期待結果 |
| --- | --- | --- |
| EDIT-GRAPHEME-FALLBACK-01 / EDIT-GRAPHEME-14,15 | `が`（分解濁点）、`ｶﾞ`、`ﾊﾟ`の基底文字と修飾文字の間 | `[[page]]`とrubyの挿入を拒否し、原文を分断しない |
| EDIT-GRAPHEME-16,17 | 完成した半角カナclusterの直後、Segmenter有効時の同じ境界 | 正当な挿入境界を維持し、Segmenter有効経路の意味を変更しない |
| EDIT-GRAPHEME-18,19 | `각`のL/V/T内部と`각`の音節/T内部 | GB6–GB8内部のruby/page挿入を拒否する |
| EDIT-GRAPHEME-20,21 | 完成したHangul clusterの直後と隣接する二clusterの間 | 正当な挿入を許し、前後の文字を保持する |
| EDIT-GRAPHEME-FALLBACK-02,03 | ZWJ絵文字、skin-tone絵文字、地域指示子2文字の旗内部と旗同士の間 | 書記素内部を拒否し、完成した旗同士の境界は許可する |
| 既知の未対応境界（非合格） | `क्ष`（U+0915 U+094D U+0937）のIndic結合内部 | 現行保守的fallbackは一般的GB9cを保証しない。Segmenter経路と区別し、未対応として記録する |

## Evidence and decision

For each step record `pass / fail / not-run`, observed result, environment, screenshot/video reference, issue ID, and the exact tested commit. **Only a real browser/device run can satisfy the Android/IME/Undo/visual acceptance criteria.** Node unit tests validate markup transforms but not IME event ordering, native Undo history, or CSS layout. Formal CAT machine gates remain independent.
