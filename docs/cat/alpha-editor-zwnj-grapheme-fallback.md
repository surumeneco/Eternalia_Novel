---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.editor-zwnj-grapheme-fallback
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
  - https://github.com/surumeneco/Eternalia_Novel/pull/12
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha editor — ZWNJ grapheme fallback (CAT Draft)

## Targets

| Ref | Aspect |
| --- | --- |
| editor.selection-boundary | UTF-16 selection offsets without Intl.Segmenter must not split the Unicode grapheme before U+200C ZERO WIDTH NON-JOINER |

## Rules

| ID | Condition | Requirement | Verification |
| --- | --- | --- | --- |
| EDITOR-ZWNJ-01 | Intl.Segmenter is unavailable and insertion offset falls immediately before U+200C after a base letter | Reject markup insertion inside the grapheme | fallbackRejectsBoundaryBeforeZwnj |
| EDITOR-ZWNJ-02 | Insertion offset falls after U+200C and before the next unrelated Latin letter | Preserve the legal grapheme boundary | fallbackAllowsBoundaryAfterZwnj |
| EDITOR-ZWNJ-03 | Intl.Segmenter is available | Match the native grapheme boundary decisions for the same input | segmenterReferenceRejectsBeforeAndAllowsAfter |

## Test vectors

| ID | Input | Required result |
| --- | --- | --- |
| EDITOR-ZWNJ-01 | 前a + U+200C + b後, insert page at UTF-16 offset 2 with Segmenter disabled | null |
| EDITOR-ZWNJ-02 | Same string, insert page at offset 3 with Segmenter disabled | 前a + U+200C + [[page]] + b後 |
| EDITOR-ZWNJ-03 | Native Intl.Segmenter('ja') on same input | offset 2 inside grapheme; offset 3 is boundary |

## Scope and status

**Draft only.** U+200C is a Grapheme_Cluster_Break Extend character under UAX #29. The current fallback handles combining marks, U+200D ZWJ, emoji modifiers, Hangul and regional indicators, but not this non-mark extender. This Draft is distinct from PR #12's U+200D GB11 cases. It does not prove actual Android/IME/Chromium behavior or authorize a production fallback change.

CAT Process/PI/TCE confirmation and normative machine Gates, production Green and device acceptance: **not-run**.
