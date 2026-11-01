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

## Evidence and decision

For each step record `pass / fail / not-run`, observed result, environment, screenshot/video reference, issue ID, and the exact tested commit. **Only a real browser/device run can satisfy the Android/IME/Undo/visual acceptance criteria.** Node unit tests validate markup transforms but not IME event ordering, native Undo history, or CSS layout. Formal CAT machine gates remain independent.
