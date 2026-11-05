# CAT Draft — Manuscript keyboard undo and IME-safe markup

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation` flow. Normative requirements: WR-02/05/07 and DS-05 in `100_機能仕様.md`, AC-03/15/65 in `400_受入検証計画.md`. The exact editor implementation and syntax are current implementation choices, not a newly approved domain standard.

## Process candidate

Given an authorized author editing a chapter, native text entry updates the draft buffer. The author selects a span and inserts ruby markup using the existing toolbar. The inserted markup appears in the editor with the reading placeholder selected. A keyboard Undo should reverse the markup insertion without deleting the previously typed manuscript. While the editor is in IME composition, the toolbar must not modify its text. Neither operation publishes the draft.

## PI candidates

- PI-1: A toolbar insertion is one undoable editor operation.
- PI-2: Undo restores the exact prior text and leaves no partial ruby marker.
- PI-3: UTF-16 selections, including supplementary characters, are preserved.
- PI-4: IME composition blocks toolbar insertions without corrupting the pending input.
- PI-5: No automatic save or publication occurs.

## TCE candidates

- Browser Chromium with synthetic author session: native keyboard entry → select → ruby → Ctrl+Z; assert original text.
- Browser: dispatch compositionstart, click ruby, dispatch compositionend; assert unchanged text.
- Existing pure `manuscript-markup.test.mjs`: verify UTF-16 offsets and invalid ranges.

Formal CAT process-closure, TestModel/vectors/Queue, doctor/guard/conformance and normative Red/Green: **not-run**. Playwright/Actions observations must be identified separately. Test on a disposable database only.
